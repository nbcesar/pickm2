import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, LoadingController } from 'ionic-angular';

import { UserProvider } from '../../providers/user/user';

@Component({
  selector: 'page-results',
  templateUrl: 'results.html',
})
export class ResultsPage {

  currentWeek: number = 1;
  viewWeek: number = 1;
  gameWeek: string = 'gameWeek1';

  schedule: any = [];
  teams: object;

  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams,
    public userService: UserProvider,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController
  ) {
  }

  ngOnInit() {
    // Get the current NFL week
    this.userService.currentWeekRef.once('value', weekSnap => {
      this.currentWeek = weekSnap.val();
      this.viewWeek = this.currentWeek;
    });

    // Get the schedule
    this.userService.scheduleData.subscribe(
      value => {
        this.getScheduleList(value);
      },
      error => {
        console.log(error);
      }
    );

    this.userService.teamsData.subscribe(
      value => {
        this.teams = value;
      }
    );
  }

  getScheduleList(scheduleObj) {
    this.schedule = [];
    for (var i = 1; i <= 17; i++) {
      let weeklySchedule = [];
      let gameWeekString = 'gameWeek' + i;
      for (var game in scheduleObj[gameWeekString]) {
        weeklySchedule.push(scheduleObj[gameWeekString][game]);
      }
      weeklySchedule.sort(function(a,b) {return (parseInt(a.gameId) > parseInt(b.gameId)) ? 1 : ((parseInt(b.gameId) > parseInt(a.gameId)) ? -1 : 0);} ); 
      this.schedule.push(weeklySchedule);
    }
  }

  showAlert(title, subTitle) {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: subTitle,
      buttons: ['OK']
    });
    alert.present();
  }

  changeView(direction) {
    if (direction == 'forward') {
      this.viewWeek += 1;  
    }
    else {
      this.viewWeek -= 1;
    }
    this.gameWeek = 'gameWeek' + this.viewWeek;
  }
  
  setWinner(game) {
    
    let alert = this.alertCtrl.create({
      title: 'Select Winner',
      inputs: [
        {
          type: 'radio',
          label: game.awayTeam,
          value: game.awayTeam
        },
        {
          type: 'radio',
          label: game.homeTeam,
          value: game.homeTeam
        },
        {
          type: 'radio',
          label: 'TIE',
          value: 'TIE'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: data => {
            alert.dismiss();
            return false;
          }
        },
        {
          text: 'Set Winner',
          handler: results => {
            alert.dismiss();
            this.userService.setGameResults(game, results);
            return false;
          }
        }
      ]
    });
    alert.present();
  }

  endWeek() {
    this.userService.endWeek(this.currentWeek);
  }

  toggleLock(game) {
    this.userService.lockGame(game.gameId, game.gameWeek, game.locked);  
  }

}
