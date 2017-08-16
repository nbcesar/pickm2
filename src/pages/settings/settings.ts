import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';

import { UserProvider } from '../../providers/user/user';
 
@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html',
})
export class SettingsPage {

  currentUserEmail: any;
  admin: boolean = false;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public userService: UserProvider,
    public alertCtrl: AlertController 
  ) {
  }

  ionViewDidLoad() {
    this.currentUserEmail = this.userService.currentEmail;
    console.log(this.currentUserEmail);
    if (this.currentUserEmail == 'nbcesar+pickm@gmail.com') this.admin = true;
  }

  logOut() {
    this.userService.logout();
  }

  addPick() {
    let confirm = this.alertCtrl.create({
      title: 'Buy a Pick for $25?',
      message: "Please confirm that you want to buy an additional pick for $25. Your payment is handled securely by Stripe. Pick'm will not see or save your payment information.",
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            console.log('Disagree clicked');
          }
        },
        {
          text: 'Buy a Pick',
          handler: () => {
            console.log('Agree clicked');
            this.userService.openCheckout(1);
          }
        }
      ]
    });
    confirm.present();
    
  }

}
