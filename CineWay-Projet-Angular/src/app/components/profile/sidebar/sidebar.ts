import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { APP_ROUTES } from '../../../config/app-routes.confg';
import { User } from '../../../auth/model/user';
import { UserApi } from '../../../services/user-api';
import { CommonModule } from '@angular/common';

type SectionType = 'profile' | 'payment' | 'history' | 'help' | 'preferences';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnChanges {
  APP_Routes = APP_ROUTES;
  private userApi = inject(UserApi);

  user = this.userApi.user;
  selectedSection: SectionType = 'profile';
  isCollapsed = false;

  @Input() currentSection: SectionType = 'profile';
  @Output() logout = new EventEmitter<void>();
  @Output() sectionChange = new EventEmitter<SectionType>();

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentSection']) {
      this.selectedSection = this.currentSection;
    }
  }

  onLogoutClick() {
    this.logout.emit();
  }

  selectSection(section: SectionType) {
    this.selectedSection = section;
    this.sectionChange.emit(section);
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
  }
}
