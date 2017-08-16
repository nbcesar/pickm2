import { Component, ViewChild } from '@angular/core';
import { NavController, Platform, Content } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UserProvider } from '../../providers/user/user';

@Component({
  selector: 'page-landing',
  templateUrl: 'landing.html'
})
export class LandingPage {

  @ViewChild(Content) content: Content;

  mobile: boolean = true;
  action: string = 'signup';

  signupForm: FormGroup;
  loginForm: FormGroup;

  constructor(
    public navCtrl: NavController,
    public plt: Platform,
    public formBuilder: FormBuilder,
    public userService: UserProvider
  ) {
    this.mobile = this.plt.is('mobile') || this.plt.is('mobileweb') || this.plt.width() < 500;
    
    this.signupForm = formBuilder.group({
      email: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required],
    });

    this.loginForm = formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  scrollDown() {
    this.content.scrollToBottom();
  }

  signup() {
    this.userService.signup(this.signupForm.value);
  }

  login() {
    this.userService.login(this.loginForm.value);
  }
}
