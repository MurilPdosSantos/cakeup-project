export enum StoreModule {
  METRICS = "METRICS",
  MENU = "MENU",
  PRODUCTS = "PRODUCTS",
  INVOICES = "INVOICES",
  ASSEMBLY = "ASSEMBLY"
}

export const GLOBAL_MODULES: StoreModule[] = [
  StoreModule.METRICS,
  StoreModule.MENU,
  StoreModule.PRODUCTS,
  StoreModule.INVOICES
];

export const OPTIONAL_MODULES: StoreModule[] = [StoreModule.ASSEMBLY];
