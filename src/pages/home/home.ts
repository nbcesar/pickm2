import { Component } from '@angular/core';
import { NavController, NavParams, Platform, ToastController } from 'ionic-angular';

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
    public userService: UserProvider,
    public toastCtrl: ToastController
  ) {
    this.mobile = this.plt.is('mobile') || this.plt.is('mobileweb') || this.plt.width() < 500;
  }

  ngOnInit() {
    window['isUpdateAvailable']
      .then(isAvailable => {
        if (isAvailable) {
          const toast = this.toastCtrl.create({
            message: 'New Update available! Reload the webapp to see the latest juicy changes.',
            position: 'bottom',
            showCloseButton: true,
          });
          toast.present();
        }
      });
  }

  ionViewDidLoad() {
    
  }

  goToSettings() {
    this.navCtrl.push(SettingsPage);
  }
}
