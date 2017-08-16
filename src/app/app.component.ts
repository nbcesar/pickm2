import { Component } from '@angular/core';
import { Platform, LoadingController } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import firebase from 'firebase';

import { LandingPage } from '../pages/landing/landing';
import { HomePage } from '../pages/home/home';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage:any;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, public loadingCtrl: LoadingController) {
    
    firebase.initializeApp({
      apiKey: "AIzaSyAiquWTntv-tFERuUPdpVhfDUrVNliHFDQ",
      authDomain: "mrcesarapp.firebaseapp.com",
      databaseURL: "https://mrcesarapp.firebaseio.com",
      projectId: "mrcesarapp",
      storageBucket: "mrcesarapp.appspot.com",
      messagingSenderId: "1023633367637"
    });
    
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
    });

    firebase.auth().onAuthStateChanged(user => {
      if (user) {        
        let loading = this.loadingCtrl.create({
          content: 'Loading...',
          showBackdrop: false,
          duration: 2500
        });
        loading.present();
        this.rootPage = HomePage;
      }
      else {
        this.rootPage = LandingPage;
      }
    });
  }
}

