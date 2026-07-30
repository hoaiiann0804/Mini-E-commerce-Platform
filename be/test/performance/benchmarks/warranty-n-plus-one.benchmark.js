async function loadWarrantiesNPlusOne(cartItems, logging) {
  return Promise.all(
    cartItems.map(async (item) => {
      const itemData = typeof item.toJSON === "function" ? item.toJSON() : item;

      if (itemData.warrantyPackageIds?.length > 0) {
        const warranties = await WarrantyPackage.findAll({
          where: {
            id: itemData.warrantyPackageIds,
            isActive: true,
          },
          attributes: ["id", "name", "price", "durationMonths"],
          raw: true,
          logging,
        });

        itemData.warrantyPackages = warranties;
      } else {
        itemData.warrantyPackages = [];
      }

      return itemData;
    }),
  );
}
