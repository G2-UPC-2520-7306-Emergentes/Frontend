import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {NgIf} from '@angular/common';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgIf,
    RouterLink
  ],
  styleUrls: ['./login.component.css'] // Make sure to create this CSS file
})
export class LoginComponent implements OnInit {
  // Define the form group
  loginForm!: FormGroup;

  // State variables for the component
  loginError: boolean = false;
  passwordVisible: boolean = false;

  // Inject FormBuilder in the constructor
  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    // Initialize the form with controls and validators
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]] // Example minimum length
    });
  }

  // Method to handle the form submission
  onSubmit(): void {
    this.loginError = false; // Reset error state

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      console.log('Attempting login with:', email, password);

      // --- SIMULATED LOGIN LOGIC ---
      // In a real application, you would call an authentication service here.
      // For demonstration, we'll simulate a failure:
      if (email === 'test@example.com' && password === 'correctpassword') {
        console.log('Login Successful!');
        // Navigate to dashboard or clear form
      } else {
        // Show the specific error message from the image
        this.loginError = true;
      }
      // --- END SIMULATED LOGIN LOGIC ---

    } else {
      // Mark all fields as touched to show validation errors immediately
      this.loginForm.markAllAsTouched();
    }
  }

  // Method to toggle the password visibility
  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }
}
