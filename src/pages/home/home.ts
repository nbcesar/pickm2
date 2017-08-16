import { Component } from '@angular/core';
import { NavController, NavParams, Platform } from 'ionic-angular';

import { SettingsPage } from '../settings/settings';
import { UserProvider } from '../../providers/user/user';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
})
export class HomePage {

  mobile: boolean = true;
  page: string = "picks";
  
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public plt: Platform, 
    public userService: UserProvider
  ) {
    this.mobile = this.plt.is('mobile') || this.plt.is('mobileweb') || this.plt.width() < 500;
  }

  ionViewDidLoad() {
    
  }

  goToSettings() {
    this.navCtrl.push(SettingsPage);
  }
}
