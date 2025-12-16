import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ArchiveService } from '../../Services/archive.service';
import { formatPlateNumber as formatPlateInput } from '../../Core/Models/plate.utils';
import { ArchiveItemDto, ArchiveAction, ArchiveType } from '../../Core/Models/archive.models';

@Component({
  selector: 'app-lpr-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './lpr-request.html',
  styleUrl: './lpr-request.css',
})
export class LprRequest implements OnInit {
  private archiveService = inject(ArchiveService);

  plateNumber = '';
  note = '';
  archiveType: ArchiveType = ArchiveType.SendFile;

  readonly ArchiveTypeEnum = ArchiveType;

  isSubmitting = signal(false);
  errorMsg = signal('');

  todayLoading = signal(false);
  todayError = signal('');
  todayRequests = signal<ArchiveItemDto[]>([]);

  todayCount = computed(() => this.todayRequests().length);
  todayPending = computed(
    () => this.todayRequests().filter((r) => r.actionTaken === ArchiveAction.Pending).length
  );
  todayApproved = computed(
    () => this.todayRequests().filter((r) => r.actionTaken === ArchiveAction.Approved).length
  );
  todayRejected = computed(
    () => this.todayRequests().filter((r) => r.actionTaken === ArchiveAction.Rejected).length
  );

  ngOnInit(): void {
    this.loadToday();
  }

  loadToday(): void {
    this.todayLoading.set(true);
    this.todayError.set('');

    this.archiveService.getAllRequests({ pageSize: 100 }).subscribe({
      next: (res) => {
        this.todayLoading.set(false);

        if (!res?.data) {
          this.todayError.set('فشل في تحميل الطلبات');
          this.todayRequests.set([]);
          return;
        }

        this.todayRequests.set(res.data ?? []);
      },
      error: (err) => {
        this.todayLoading.set(false);
        console.error(err);
        this.todayError.set('فشل في تحميل الطلبات');
      },
    });
  }

  formatPlateNumber(): void {
    this.plateNumber = formatPlateInput(this.plateNumber);
  }

  submit(): void {
    this.errorMsg.set('');

    const cleanPlate = formatPlateInput(this.plateNumber);

    if (!cleanPlate) {
      this.errorMsg.set('رقم اللوحة مطلوب');
      return;
    }

    this.isSubmitting.set(true);

    this.archiveService
      .createRequest({
        plateNumber: cleanPlate,
        action: this.archiveType,
        note: (this.note ?? '').trim(),
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);

          if (res?.isSuccess === false) {
            this.errorMsg.set('فشل في إرسال الطلب');
            return;
          }

          this.plateNumber = '';
          this.note = '';

          this.loadToday();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          console.error(err);
          this.errorMsg.set('فشل في إرسال الطلب');
        },
      });
  }

  badgeClass(action: ArchiveAction): string {
    switch (action) {
      case ArchiveAction.Approved:
        return 'badge badge--approved';
      case ArchiveAction.Rejected:
        return 'badge badge--rejected';
      default:
        return 'badge badge--pending';
    }
  }

  getActionLabel(action: ArchiveAction): string {
    switch (action) {
      case ArchiveAction.Approved:
        return 'موافق';
      case ArchiveAction.Rejected:
        return 'مرفوض';
      case ArchiveAction.Pending:
        return 'قيد الانتظار';
      default:
        return 'غير معروف';
    }
  }
}
