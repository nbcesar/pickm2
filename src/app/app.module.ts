import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { HttpModule } from '@angular/http';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { LandingPage } from '../pages/landing/landing';
import { HomePage } from '../pages/home/home';
import { SettingsPage } from '../pages/settings/settings';

import { LeagueComponent } from '../components/league/league';
import { LeagueUserComponent } from '../components/league-user/league-user';
import { PicksComponent } from '../components/picks/picks';

import { UserProvider } from '../providers/user/user';

@NgModule({
  declarations: [
    MyApp,
    LandingPage,
    HomePage,
    LeagueComponent,
    LeagueUserComponent,
    PicksComponent,
    SettingsPage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp)
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    LandingPage,
    HomePage,
    LeagueComponent,
    LeagueUserComponent,
    PicksComponent,
    SettingsPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
    UserProvider
  ]
})
export class AppModule {}
