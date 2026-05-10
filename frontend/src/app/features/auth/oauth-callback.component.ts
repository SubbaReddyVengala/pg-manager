import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="callback-container">
      <mat-spinner diameter="40"></mat-spinner>
      <p>Finalizing your secure login...</p>
    </div>
  `,
  styles: [`
    .callback-container {
      height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 20px;
      font-family: 'Inter', sans-serif; color: #64748b;
    }
  `]
})
export class OauthCallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    // Fragment looks like: #access_token=...
    const fragment = window.location.hash;
    if (fragment) {
      const params = new URLSearchParams(fragment.substring(1));
      const token = params.get('access_token');
      
      if (token) {
        this.auth.handleOAuthToken(token);
        
        // Use same logic as Login
        const user = this.auth.getRawUser();
        if (user?.role === 'SUPER_ADMIN') {
          this.router.navigate(['/dashboard/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.router.navigate(['/login'], { queryParams: { error: 'oauth_failed' }});
      }
    } else {
      this.router.navigate(['/login']);
    }
  }
}
