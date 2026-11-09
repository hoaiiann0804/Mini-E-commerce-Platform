/* Run: node test/inventory.integration.cjs
 * Creates and drops only a uniquely named inventory_test_* database.
 * Requires a local PostgreSQL role with CREATEDB; never migrates the application DB.
 */
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { Client } = require("pg");
require("dotenv").config();

const database = `inventory_test_${Date.now()}`;
const connection = { host: process.env.INVENTORY_TEST_HOST || "localhost", port: Number(process.env.INVENTORY_TEST_PORT || 6000),
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: "postgres" };
const admin = new Client(connection);
let sequelize;
let created = false;
let passed = 0;
const check = async (name, fn) => { await fn(); passed++; console.log(`PASS ${name}`); };

async function main() {
  await admin.connect();
  assert.match(database, /^inventory_test_\d+$/);
  await admin.query(`CREATE DATABASE "${database}"`);
  created = true;
  delete process.env.DATABASE_URL;
  Object.assign(process.env, { NODE_ENV: "test", DB_HOST: connection.host, DB_PORT: String(connection.port), DB_NAME_TEST: database, JWT_SECRET: "inventory-test-only-secret" });
  sequelize = require("../src/config/sequelize");
  const { Product, ProductVariant, User, Order, OrderItem } = require("../src/models");
  // Only the newly created disposable database is synchronized.
  assert.equal(sequelize.config.database, database);
  await sequelize.sync();
  const makeProduct = (extra = {}) => Product.create({ name: "Inventory fixture", slug: randomUUID(), description: "Fixture", shortDescription: "Fixture", price: 100, stockQuantity: 0, ...extra });
  const opening = await makeProduct({ stockQuantity: 7 });
  await require("../src/migrations/20260330103652-add-stock-sync-trigger").up(sequelize.getQueryInterface());
  await require("../src/migrations/20260921090000-inventory-ledger").up(sequelize.getQueryInterface());
  const service = require("../src/services/inventory.service");
  const Ledger = require("../src/models/inventoryTransaction");
  const user = await User.create({ email: "admin@inventory.test", firstName: "Inventory", lastName: "Admin", role: "admin", isEmailVerified: true });
  const product = await makeProduct();
  const input = (extra = {}) => ({ productId: product.id, type: "IN", quantityChange: 1, unitCost: 25, reason: "Phiếu nhập kiểm thử", requestKey: randomUUID(), ...extra });

  await check("baseline preserves existing balance without inventing cost", async () => {
    const row = await Ledger.findOne({ where: { productId: opening.id } });
    assert.equal(row.type, "OPENING"); assert.equal(row.newStock, 7); assert.equal(row.unitCost, null);
  });
  await check("concurrent retries import once, retain actor/cost and reject changed payload", async () => {
    const data = input();
    const [a,b] = await Promise.all([service.manual(data,user), service.manual(data,user)]);
    assert.equal(a.id,b.id); assert.equal(a.createdBy,user.id); assert.equal(Number(a.unitCost),25);
    assert.equal((await product.reload()).stockQuantity,1);
    await assert.rejects(service.manual({ ...data,quantityChange: 2 },user), /nội dung khác/);
  });
  await check("two requests compete for last unit; exactly one succeeds", async () => {
    const results = await Promise.allSettled([service.manual(input({ type:"ADJUSTMENT", quantityChange:-1, unitCost:undefined }),user),service.manual(input({ type:"ADJUSTMENT", quantityChange:-1, unitCost:undefined }),user)]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    assert.equal((await product.reload()).stockQuantity,0);
  });
  await check("missing context blocks direct stock writes; context cannot leak from pool", async () => {
    await assert.rejects(Product.increment("stockQuantity",{by:1,where:{id:product.id}}), /context/);
    assert.equal((await product.reload()).stockQuantity,0);
  });
  await check("audit constraint failure rolls back stock", async () => {
    const before = await Ledger.count({where:{productId:product.id}});
    await assert.rejects(sequelize.transaction(t=>service.change({productId:product.id,quantityChange:1,type:"IN",source:"TEST",reason:"Missing cost"},t)));
    assert.equal((await product.reload()).stockQuantity,0);
    assert.equal(await Ledger.count({where:{productId:product.id}}),before);
  });
  await check("history is immutable and referenced products cannot be deleted", async () => {
    await assert.rejects(Ledger.destroy({where:{productId:product.id}}),/append-only/);
    await assert.rejects(product.destroy());
  });
  let parent,variant;
  await check("variant stock changes produce one entry and synchronize parent total", async () => {
    parent = await makeProduct({ isVariantProduct:true });
    variant = await ProductVariant.create({productId:parent.id,name:"Blue",sku:randomUUID(),price:100,stockQuantity:0});
    await service.manual(input({productId:parent.id,variantId:variant.id,quantityChange:3}),user);
    assert.equal((await parent.reload()).stockQuantity,3);
    assert.equal(await Ledger.count({where:{productId:parent.id,variantId:null}}),0);
    assert.equal(await Ledger.count({where:{variantId:variant.id,type:"IN"}}),1);
  });
  await check("catalog preserves variant ID and ignores stale stock", async () => {
    await sequelize.transaction(async t=>service.saveVariants(parent.id,[{id:variant.id,name:"Blue updated",stock:999}],t));
    assert.equal((await variant.reload()).stockQuantity,3);
    assert.equal(variant.name,"Blue updated");
    await sequelize.transaction(async t=>service.saveVariants(parent.id,[],t));
    assert.equal((await variant.reload()).isAvailable,false);
    assert.equal((await parent.reload()).stockQuantity,3);
  });
  await check("catalog managed transaction propagates and returns success only after commit", async () => {
    const req={user};let response;
    const res={statusCode:200,json(body){response=body;return this;}};
    await service.catalogMutation(async (_req,r)=>{
      const p=await makeProduct({stockQuantity:2});r.json({id:p.id});
    })(req,res);
    const row=await Ledger.findOne({where:{productId:response.id}});
    assert.equal(row.createdBy,user.id);
    let failedId;
    await assert.rejects(service.catalogMutation(async()=>{failedId=(await makeProduct({stockQuantity:2})).id;throw new Error('forced rollback');})(req,res),/forced rollback/);
    assert.equal(await Product.findByPk(failedId),null);
  });

  function orderValues(extra={}) {
    const values={userId:user.id,number:randomUUID(),subtotal:100,tax:0,shippingCost:0,total:100,paymentMethod:"cod",...extra};
    for(const [key,attr] of Object.entries(Order.rawAttributes)) {
      if(attr.allowNull===false && attr.defaultValue===undefined && values[key]===undefined && !["id","createdAt","updatedAt"].includes(key)) values[key]="Fixture";
    }
    return values;
  }
  let order,item;
  await check("order OUT and repeated cancellation release exactly once", async()=>{
    await service.manual(input({quantityChange:3}),user);
    await sequelize.transaction(async t=>{
      order=await Order.create(orderValues(),{transaction:t});
      item=await OrderItem.create({orderId:order.id,productId:product.id,name:"Fixture",price:100,quantity:2,subtotal:200},{transaction:t});
      await service.orderMovement(order,[item],"OUT",user,t,"Checkout test");
    });
    assert.equal((await product.reload()).stockQuantity,1);
    await Promise.all([service.transitionOrder(order.id,"cancelled",user,{customer:true}),service.transitionOrder(order.id,"cancelled",user)]);
    assert.equal((await product.reload()).stockQuantity,3);
    assert.equal(await Ledger.count({where:{orderItemId:item.id,type:"RELEASE"}}),1);
    await assert.rejects(service.transitionOrder(order.id,"processing",user),/Không thể chuyển/);
  });
  await check("partial returns serialize and never exceed the sold quantity", async()=>{
    const delivered=await Order.create(orderValues({status:"delivered"}));
    const sold=await OrderItem.create({orderId:delivered.id,productId:product.id,name:"Fixture",price:100,quantity:2,subtotal:200});
    const results=await Promise.allSettled([service.manual(input({type:"RETURN",quantityChange:2,unitCost:undefined,orderItemId:sold.id}),user),service.manual(input({type:"RETURN",quantityChange:1,unitCost:undefined,orderItemId:sold.id}),user)]);
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
    assert.ok(Number(await Ledger.sum('quantityChange',{where:{orderItemId:sold.id,type:'RETURN'}}))<=2);
  });
  await check("API authorization, low-stock, history, stats and input validation",async()=>{
    const app=require('express')();app.use(require('express').json());
    app.use('/inventory',require('../src/routes/inventory.routes'));
    app.use((e,_req,res,_next)=>res.status(e.statusCode||500).json({message:e.message}));
    const request=require('supertest')(app);
    const token=require('jsonwebtoken').sign({id:user.id},process.env.JWT_SECRET);
    assert.equal((await request.get('/inventory/stock')).status,401);
    for(const url of ['/inventory/stock?lowStock=true','/inventory/transactions','/inventory/stats']) {
      const res=await request.get(url).set('Authorization',`Bearer ${token}`);
      assert.equal(res.status,200,JSON.stringify(res.body));
      if(url.includes('stock')) assert.ok(res.body.data.rows.every(r=>r.stockQuantity<=5));
    }
    const bad=await request.post('/inventory/transactions').set('Authorization',`Bearer ${token}`).send(input({quantityChange:0}));
    assert.equal(bad.status,400);
  });
  await check("ledger telescopes to current balance",async()=>{
    for(const p of [product,opening]) {
      const sum=Number(await Ledger.sum('quantityChange',{where:{productId:p.id}}));
      assert.equal(sum,(await p.reload()).stockQuantity);
    }
  });
  console.log(`Inventory integration: ${passed} checks passed`);
}

main().catch(error=>{console.error(error.message);if(error.original)console.error(error.original.message);process.exitCode=1;}).finally(async()=>{
  if(sequelize)await sequelize.close();
  if(created)await admin.query(`DROP DATABASE "${database}" WITH (FORCE)`);
  await admin.end();
});
