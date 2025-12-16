export enum ArchiveAction {
  Pending = 0,
  Rejected = 1,
  Approved = 2,
}

export enum ArchiveType {
  SendFile = 1,
  Other = 2,
}

export interface ArchiveRequestCreate {
  plateNumber: string;
  action: ArchiveType;
  note: string;
}

export interface ArchiveItemDto {
  id: string;
  plateNumber: string;
  actionTaken: ArchiveAction;
  actionType: ArchiveType;
  note: string;
  rejectReason: string | null;
}

export interface PaginatedResponse<T> {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  data: T[];
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface SearchQueryParams {
  searchText?: string;
  orderSort?: number;
  pageNumber?: number;
  pageSize?: number;
}

export interface ActionRequest {
  id: string;
  actionTaken: ArchiveAction;
  rejectReason?: string;
}
