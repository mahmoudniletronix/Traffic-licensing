import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  ArchiveRequestCreate,
  ActionRequest,
  PaginatedResponse,
  ArchiveItemDto,
  SearchQueryParams,
} from '../Core/Models/archive.models';

@Injectable({ providedIn: 'root' })
export class ArchiveService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/ArchiveRequests`;

  createRequest(body: ArchiveRequestCreate): Observable<{ isSuccess: boolean }> {
    return this.http.post<{ isSuccess: boolean }>(this.baseUrl, body);
  }

  getAllRequests(searchParams?: SearchQueryParams): Observable<PaginatedResponse<ArchiveItemDto>> {
    let params = new HttpParams();

    if (searchParams?.searchText) {
      params = params.set('searchText', searchParams.searchText);
    }
    if (searchParams?.orderSort !== undefined) {
      params = params.set('orderSort', searchParams.orderSort.toString());
    }
    if (searchParams?.pageNumber !== undefined) {
      params = params.set('pageNumber', searchParams.pageNumber.toString());
    }
    if (searchParams?.pageSize !== undefined) {
      params = params.set('pageSize', searchParams.pageSize.toString());
    }

    return this.http.get<PaginatedResponse<ArchiveItemDto>>(this.baseUrl, { params });
  }

  updateAction(body: ActionRequest): Observable<{ isSuccess: boolean }> {
    return this.http.post<{ isSuccess: boolean }>(`${this.baseUrl}/ActionTaken`, body);
  }
}
