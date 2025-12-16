import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArchiveService } from '../../Services/archive.service';
import { ArchiveAction, ArchiveItemDto } from '../../Core/Models/archive.models';

@Component({
  selector: 'app-archive-component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './archive-component.html',
  styleUrls: ['./archive-component.css'],
})
export class ArchiveComponent implements OnInit {
  private readonly archiveService = inject(ArchiveService);

  requests = signal<ArchiveItemDto[]>([]); // Pending requests
  completedRequests = signal<ArchiveItemDto[]>([]); // Approved & Rejected
  searchResults = signal<ArchiveItemDto[]>([]); // Search results
  loading = signal(false);
  errorMsg = signal('');

  inProgressIds = signal<string[]>([]);

  // Reject reason state
  rejectingId = signal<string | null>(null);
  rejectReason = signal('');

  // Search & Pagination state for Pending
  searchText = signal('');
  currentPage = signal(1);
  pageSize = signal(10);
  totalItems = signal(0);
  totalPages = signal(0);

  // Pagination state for Completed (Approved + Rejected)
  completedPage = signal(1);
  completedPageSize = signal(10);
  completedTotalItems = signal(0);
  completedTotalPages = signal(0);
  ngOnInit(): void {
    this.loadRequests();
    this.loadCompletedRequests();
    this.loadRequests();
  }

  loadRequests(): void {
    this.loading.set(true);
    this.errorMsg.set('');

    this.archiveService
      .getAllRequests({
        searchText: this.searchText() || undefined,
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);

          if (!res?.data) {
            this.errorMsg.set('فشل في تحميل الطلبات.');
            return;
          }

          const list = res.data;

          // If searching, store in searchResults, otherwise in requests
          if (this.searchText()) {
            this.searchResults.set(list);
          } else {
            this.requests.set(list);
            this.searchResults.set([]); // Clear search results when not searching
          }

          this.totalItems.set(res.totalItems);
          this.totalPages.set(res.totalPages);

          // Clean up inProgressIds: remove IDs that are no longer pending
          const pendingIds = new Set(
            list.filter((x) => x.actionTaken === ArchiveAction.Pending).map((x) => x.id)
          );
          this.inProgressIds.update((ids) => ids.filter((id) => pendingIds.has(id)));
        },
        error: (err) => {
          this.loading.set(false);
          console.error('Error fetching requests', err);
          this.errorMsg.set('خطأ في جلب الطلبات');
        },
      });
  }

  loadCompletedRequests(): void {
    this.loading.set(true);

    this.archiveService
      .getAllRequests({
        pageNumber: this.completedPage(),
        pageSize: this.completedPageSize(),
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);

          if (!res?.data) {
            return;
          }

          // Filter only completed requests (Approved or Rejected)
          const completed = res.data.filter(
            (x) =>
              x.actionTaken === ArchiveAction.Approved || x.actionTaken === ArchiveAction.Rejected
          );
          this.completedRequests.set(completed);
          this.completedTotalItems.set(res.totalItems);
          this.completedTotalPages.set(res.totalPages);
        },
        error: (err) => {
          this.loading.set(false);
          console.error('Error fetching completed requests', err);
        },
      });
  }

  // ===== Derived lists =====
  pending = computed(() => this.requests().filter((r) => r.actionTaken === ArchiveAction.Pending));
  approved = computed(() =>
    this.completedRequests().filter((r) => r.actionTaken === ArchiveAction.Approved)
  );
  rejected = computed(() =>
    this.completedRequests().filter((r) => r.actionTaken === ArchiveAction.Rejected)
  );

  firstPendingId = computed(() => this.pending()[0]?.id ?? null);

  isFirstPending(id: string): boolean {
    return this.firstPendingId() === id;
  }

  isInProgress(id: string): boolean {
    return this.inProgressIds().includes(id);
  }

  inProgress = computed(() => {
    const ids = this.inProgressIds();
    const pendingList = this.pending();
    const map = new Map(pendingList.map((x) => [x.id, x]));
    return ids.map((id) => map.get(id)).filter(Boolean) as ArchiveItemDto[];
  });

  // ===== Actions =====

  execute(req: ArchiveItemDto): void {
    if (!this.isFirstPending(req.id)) return;

    this.inProgressIds.update((ids) => (ids.includes(req.id) ? ids : [...ids, req.id]));
  }

  removeFromWorkList(id: string): void {
    this.inProgressIds.update((ids) => ids.filter((x) => x !== id));
  }

  approve(id: string): void {
    this.sendAction(ArchiveAction.Approved, id);
  }

  reject(id: string): void {
    // Show reject reason input
    this.rejectingId.set(id);
    this.rejectReason.set('');
  }

  confirmReject(id: string): void {
    const reason = this.rejectReason().trim();
    if (!reason) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }
    this.sendAction(ArchiveAction.Rejected, id, reason);
    this.cancelReject();
  }

  cancelReject(): void {
    this.rejectingId.set(null);
    this.rejectReason.set('');
  }

  rollbackToPending(id: string): void {
    this.sendAction(ArchiveAction.Pending, id);
  }

  private sendAction(actionTaken: ArchiveAction, id: string, rejectReason?: string): void {
    this.loading.set(true);

    this.archiveService.updateAction({ actionTaken, id, rejectReason }).subscribe({
      next: (res) => {
        this.loading.set(false);

        if (res?.isSuccess === false) {
          alert('فشلت العملية');
          return;
        }

        this.removeFromWorkList(id);
        this.loadRequests();
        this.loadCompletedRequests();
      },
      error: (err) => {
        this.loading.set(false);
        console.error(err);
        alert('فشلت العملية');
      },
    });
  }

  // ===== Search & Pagination =====

  onSearch(): void {
    this.currentPage.set(1); // Reset to first page on new search
    this.loadRequests();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadRequests();
  }

  get hasPreviousPage(): boolean {
    return this.currentPage() > 1;
  }

  get hasNextPage(): boolean {
    return this.currentPage() < this.totalPages();
  }

  onCompletedPageChange(page: number): void {
    if (page < 1 || page > this.completedTotalPages()) return;
    this.completedPage.set(page);
    this.loadCompletedRequests();
  }

  get hasCompletedPreviousPage(): boolean {
    return this.completedPage() > 1;
  }

  get hasCompletedNextPage(): boolean {
    return this.completedPage() < this.completedTotalPages();
  }
}
