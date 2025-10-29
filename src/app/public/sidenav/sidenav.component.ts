import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { ThemeService } from '../../shared/services/theme.service';
import {UserService} from '../../Foodchain/services/user.service';
import {SessionService} from '../../Foodchain/services/session.service';


type CompanyOption = 'join' | 'create' | null;

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    HeaderComponent,
    FooterComponent
  ],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.css'
})
export class SidenavComponent implements OnInit {

  isDarkTheme$!: Observable<boolean>;


  userCompanyOption: CompanyOption = null;


  isCompanyJoin: boolean = false;
  isCompanyCreate: boolean = false;

  constructor(
    private themeService: ThemeService,
    private sessionService: SessionService, // Inyectado
    private userService: UserService // ✅ Inyectado
  ) {
    this.isDarkTheme$ = this.themeService.isDarkTheme$;
  }

  ngOnInit(): void {
    const userId = this.sessionService.getUserId();

    if (userId) {
      this.loadUserCompanyOption(userId);
    } else {
      console.warn("No hay usuario conectado. Opciones de navegación limitadas.");
    }
  }

  /**
   * Carga la companyOption del usuario conectado usando el UserService.
   */
  loadUserCompanyOption(userId: string): void {
    // Usamos el método getById de tu UserService (heredado del BaseService)
    this.userService.getById(userId).subscribe({
      next: (user) => {

        const option = user.companyOption.toLowerCase();

        if (option === 'join' || option === 'create') {
          this.userCompanyOption = option as CompanyOption;
        } else {
          this.userCompanyOption = null;
        }


        this.isCompanyJoin = (this.userCompanyOption === 'join');
        this.isCompanyCreate = (this.userCompanyOption === 'create');

        console.log(`Company Option cargada: ${this.userCompanyOption}`);
      },
      error: (err) => {
        console.error('Error al cargar datos del usuario para el SIDENAV:', err);

        this.userCompanyOption = null;
      }
    });
  }

  toggleTheme(): void {
    this.themeService.toggleDarkTheme();
  }
}
