export enum UserType {
  ADMIN = 'admin',
  NORMAL_USER = 'normalUser',
}

export enum ItemStatusType {
  ACTIVE = 'active',
  DRAFT = 'draft',
  SOLD = 'sold',
  EXPIRED = 'expired',
}

export enum SortingType {
  CREATION = 'desc-creation',
  DESC_PRICE = 'desc-price',
  ASC_PRICE = 'asc-price',
  DISTANCE = 'distance',
  SEARCH_SCORE = 'search-score',
}
