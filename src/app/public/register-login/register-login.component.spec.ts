import { ComponentFixture, TestBed } from '@angular/core/testing';
// 🚨 CORREGIDO 1: El nombre del archivo y la clase importada
import { RegisterLoginComponent } from './register-login.component';
import { FormsModule } from '@angular/forms'; // Necesario para Forms Dirigidos por Plantilla

// 🚨 CORREGIDO 2: El nombre de la clase en el 'describe'
describe('RegisterLoginComponent', () => {
  // 🚨 CORREGIDO 3: Usamos el nombre de la clase correcta
  let component: RegisterLoginComponent;
  let fixture: ComponentFixture<RegisterLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // Si el componente es standalone, lo importamos junto con FormsModule
      imports: [RegisterLoginComponent, FormsModule]
    })
      .compileComponents();

    // 🚨 CORREGIDO 4: Crear la instancia del componente correcto
    fixture = TestBed.createComponent(RegisterLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
