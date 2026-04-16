import{r as a,j as t,ao as i}from"./index-DC-0o04a.js";import{R as L}from"./quill.snow-CPwPv8mb.js";import{b as D}from"./imageApi-aTblvSLn.js";import{B as Q}from"./Base64ImageWarning-Bqg--Dnb.js";import{F as $}from"./index-D4moqPD1.js";import"./index-Dayfp5AN.js";import"./InfoCircleOutlined-C7AFYJnv.js";import"./collapse-BbEVqHco.js";import"./index-B82hrC_E.js";import"./useMergedState-B94wVjgf.js";import"./useForm-BTnqYidW.js";import"./row-oJA2xx8s.js";const U=({value:c="",onChange:s,placeholder:q="Nhập nội dung...",height:d=200,readonly:f=!1,productId:b,category:y="product",onImageUpload:h})=>{const[B,M]=a.useState(!1);if(a.useEffect(()=>{const e=r=>{console.error("EnhancedRichTextEditor error:",r),M(!0)};return window.addEventListener("error",e),()=>window.removeEventListener("error",e)},[]),B)return t.jsxs("div",{style:{border:"1px solid #d9d9d9",borderRadius:"6px",padding:"12px",minHeight:`${d}px`,backgroundColor:"#fff2f0",color:"#ff4d4f"},children:[t.jsx("p",{children:"❌ Rich Text Editor gặp lỗi. Đang sử dụng editor đơn giản thay thế."}),t.jsx("textarea",{placeholder:q,value:c,onChange:e=>s==null?void 0:s(e.target.value),style:{width:"100%",minHeight:`${d-60}px`,border:"none",outline:"none",resize:"vertical",fontFamily:"inherit"}})]});const[A,T]=a.useState(c),j=a.useRef(null),[E]=D(),[u,v]=a.useState(!1);a.useEffect(()=>{T(c)},[c]);const H=e=>{T(e),s&&s(e)},S=a.useCallback(async()=>{if(u){i.warning("Đang upload ảnh, vui lòng chờ...");return}const e=document.createElement("input");e.setAttribute("type","file"),e.setAttribute("accept","image/*"),e.click(),e.onchange=async()=>{var m,x,g;const r=(m=e.files)==null?void 0:m[0];if(r){if(r.size>5*1024*1024){i.error("Kích thước ảnh không được vượt quá 5MB");return}if(!r.type.startsWith("image/")){i.error("Chỉ được upload file ảnh");return}v(!0),i.loading("Đang upload ảnh...",0);try{const o=await E({file:r,options:{category:y,productId:b,generateThumbs:!0,optimize:!0}}).unwrap(),p=`http://localhost:8888/api${o.data.url}`,l=(x=j.current)==null?void 0:x.getEditor();if(l){const n=l.getSelection(!0);l.insertEmbed(n.index,"image",p),l.setSelection(n.index+1)}h&&h(p,o.data.id),i.destroy(),i.success("Upload ảnh thành công!")}catch(o){i.destroy();const p=((g=o==null?void 0:o.data)==null?void 0:g.message)||"Upload ảnh thất bại";i.error(p),console.error("Image upload error:",o)}finally{v(!1)}}}},[E,y,b,u,h]),R=a.useCallback(async e=>{var x,g;const r=e.clipboardData||window.clipboardData,m=r==null?void 0:r.items;if(m)for(let o=0;o<m.length;o++){const p=m[o];if(p.type.startsWith("image/")){e.preventDefault();const l=p.getAsFile();if(!l)continue;if(u){i.warning("Đang upload ảnh, vui lòng chờ...");return}if(l.size>5*1024*1024){i.error("Kích thước ảnh không được vượt quá 5MB");return}v(!0),i.loading("Đang upload ảnh từ clipboard...",0);try{const n=await E({file:l,options:{category:y,productId:b,generateThumbs:!0,optimize:!0}}).unwrap(),k=`http://localhost:8888/api${n.data.url}`,w=(x=j.current)==null?void 0:x.getEditor();if(w){const z=w.getSelection(!0);w.insertEmbed(z.index,"image",k),w.setSelection(z.index+1)}h&&h(k,n.data.id),i.destroy(),i.success("Upload ảnh thành công!")}catch(n){i.destroy();const k=((g=n==null?void 0:n.data)==null?void 0:g.message)||"Upload ảnh thất bại";i.error(k),console.error("Image upload error:",n)}finally{v(!1)}break}}},[E,y,b,u,h]),F=a.useMemo(()=>({toolbar:{container:[[{header:[1,2,3,!1]}],["bold","italic","underline","strike"],[{color:[]},{background:[]}],[{list:"ordered"},{list:"bullet"}],[{indent:"-1"},{indent:"+1"}],["link","image"],["clean"]],handlers:{image:S}},clipboard:{matchVisual:!1}}),[S]),N=["header","bold","italic","underline","strike","color","background","list","bullet","indent","link","image"];if(a.useEffect(()=>{var r;const e=(r=j.current)==null?void 0:r.getEditor();if(e&&!f)return e.root.addEventListener("paste",R),()=>{e.root.removeEventListener("paste",R)}},[R,f]),f)return t.jsxs("div",{className:"enhanced-rich-text-editor readonly-mode",children:[t.jsx("div",{className:"ql-editor",dangerouslySetInnerHTML:{__html:A},style:{minHeight:`${d-42}px`,border:"1px solid #ccc",borderRadius:"4px",padding:"12px 15px",backgroundColor:"#f8f9fa"}}),t.jsx("style",{children:`
          .readonly-mode .ql-editor {
            min-height: ${d-42}px;
          }
          .readonly-mode .ql-editor img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 10px 0;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .readonly-mode .ql-editor p {
            margin-bottom: 10px;
          }
        `})]});try{return t.jsxs("div",{className:"enhanced-rich-text-editor",children:[t.jsx(L,{ref:j,theme:"snow",value:A,onChange:H,modules:F,formats:N,placeholder:q,readOnly:f||u,style:{height:`${d}px`,marginBottom:"50px"}}),u&&t.jsx("div",{className:"upload-overlay",children:t.jsx("div",{className:"upload-indicator",children:"Đang upload ảnh..."})}),t.jsx("style",{children:`
        .enhanced-rich-text-editor {
          position: relative;
        }
        .enhanced-rich-text-editor .ql-editor {
          min-height: ${d-42}px;
        }
        .enhanced-rich-text-editor .ql-toolbar {
          border-top: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
        }
        .enhanced-rich-text-editor .ql-container {
          border-bottom: 1px solid #ccc;
          border-left: 1px solid #ccc;
          border-right: 1px solid #ccc;
        }
        .enhanced-rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 10px 0;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease;
        }
        .enhanced-rich-text-editor .ql-editor img:hover {
          transform: scale(1.02);
        }
        .enhanced-rich-text-editor .ql-editor p {
          margin-bottom: 10px;
        }
        .enhanced-rich-text-editor .ql-editor.ql-blank::before {
          font-style: italic;
          color: #aaa;
        }
        .upload-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .upload-indicator {
          background: #1890ff;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `})]})}catch(e){return console.error("ReactQuill render error:",e),t.jsxs("div",{style:{border:"1px solid #d9d9d9",borderRadius:"6px",padding:"12px",minHeight:`${d}px`,backgroundColor:"#fff2f0",color:"#ff4d4f"},children:[t.jsx("p",{children:"❌ Rich Text Editor gặp lỗi khi render. Đang sử dụng editor đơn giản thay thế."}),t.jsx("textarea",{placeholder:q,value:c,onChange:r=>s==null?void 0:s(r.target.value),style:{width:"100%",minHeight:`${d-60}px`,border:"none",outline:"none",resize:"vertical",fontFamily:"inherit"}})]})}},X=()=>{const[c]=$.useForm();return t.jsxs("div",{style:{padding:"20px"},children:[t.jsx("h1",{children:"Test Components"}),t.jsx("h2",{children:"EnhancedRichTextEditor"}),t.jsx($,{form:c,children:t.jsx($.Item,{name:"description",children:t.jsx(U,{placeholder:"Test editor...",height:200,category:"product"})})}),t.jsx("h2",{children:"Base64ImageWarning"}),t.jsx(Q,{description:"<img src='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...' />"})]})};export{X as default};
