export const ROLE_LABEL = {
  Farmer: 'Farmer', MandiAdmin: 'Mandi Admin', MandiStaff: 'Mandi Staff',
  WarehouseAdmin: 'Warehouse Admin', WarehouseStaff: 'Warehouse Staff',
};

export const MENU = {
  Farmer: [['/', 'Home'], ['/best-mandi', 'Best mandi'], ['/market', 'Market prices'], ['/analytics', 'Price analysis'],
    ['/routes', 'Route finder'], ['/my-sales', 'My sales'], ['/my-income', 'My income'], ['/my-stored', 'My stored produce'], ['/profile', 'Profile']],
  MandiStaff: [['/', 'Home'], ['/farmers', 'Farmers'], ['/sales', 'Sales'], ['/prices', 'Prices'], ['/crops', 'Crops']],
  MandiAdmin: [['/', 'Home'], ['/farmers', 'Farmers'], ['/sales', 'Sales'], ['/prices', 'Prices'], ['/crops', 'Crops'],
    ['/my-mandi', 'My mandi'], ['/roads', 'Roads'], ['/staff', 'Staff']],
  WarehouseStaff: [['/', 'Home'], ['/batches', 'Batches'], ['/stock', 'Stock'], ['/shelf-life', 'Crops and shelf life']],
  WarehouseAdmin: [['/', 'Home'], ['/batches', 'Batches'], ['/stock', 'Stock'], ['/shelf-life', 'Crops and shelf life'],
    ['/my-warehouse', 'My warehouse'], ['/staff', 'Staff']],
};
