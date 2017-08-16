import { Component } from '@angular/core';
import { AlertController, ToastController } from 'ionic-angular';

import { UserProvider } from '../../providers/user/user';

@Component({
  selector: 'picks',
  templateUrl: 'picks.html'
})
export class PicksComponent {

  currentWeek: number = 1;
  viewWeek: number = 1;
  gameWeek: string = 'gameWeek1';

  currentUserId: any;
  currentUserPicks: any[] = [];
  selectedPick: any;

  schedule: any = [];
  weeklySchedule: any = [];

  teams: object;

  pickNumber: number = 0;
  constructor(
    public userService: UserProvider,
    public alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {
    
  }

  ngOnInit() {
    // Get the current NFL week
    this.currentWeek = this.userService.currentWeek;
    // Get the current user's Id
    this.userService.currentUserId.subscribe(
      value => {
        this.currentUserId = value;
      },
      error => {
        console.log(error);
      }
    );
    //Get the current user's data
    this.userService.usersData.subscribe(
      value => {
        this.getCurrentUserPicks(value);
      },
      error => {
        console.log(error);
      }
    );
    this.selectedPick = this.currentUserPicks[0];    

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

  showAlert(title, subTitle) {
    let alert = this.alertCtrl.create({
      title: title,
      subTitle: subTitle,
      buttons: ['OK']
    });
    alert.present();
  }

  getScheduleList(scheduleObj) {
    this.schedule = [];
    for (var i = 1; i <= 17; i++) {
      //this.weeklySchedule.push(scheduleObj['gameWeek' + i]);
      this.weeklySchedule = [];
      let gameWeekString = 'gameWeek' + i;
      for (var game in scheduleObj[gameWeekString]) {
        this.weeklySchedule.push(scheduleObj[gameWeekString][game]);
      }
      this.schedule.push(this.weeklySchedule);
    }
  }

  getCurrentUserPicks(usersObj) {
    this.currentUserPicks = [];
    for (var user in usersObj) {
      if (this.currentUserId != user) continue;
      let picks = usersObj[user].picks;
      if (picks) {
        picks.forEach(pick => {
          this.currentUserPicks.push(pick);
        });
      }
    }
  }

  pickChange(newPick: any) {
    this.selectedPick = this.currentUserPicks[newPick];
    this.pickNumber = newPick;
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

  pickTeam(team, game) {
    /* Allowing a pick:
      ~ [X] Player is still alive
      ~ [X] Current week or later
      ~ [X] Game is not locked
      ~ [X] Player's old pick isn't locked
      ~ [X] Haven't used that team before
    */

    let pickObj = this.currentUserPicks[this.pickNumber];
    let oldTeam = pickObj.gameWeeks[this.gameWeek].team;
    let alive = pickObj.alive;

    // No pick if user's pick is !alive
    if (!alive) {
      this.showAlert("You lost", "See you next year.");
      return;
    }

    // No pick if viewWeek < currentWeek
    if (this.viewWeek < this.currentWeek) {
      this.showAlert('Invalid Pick', 'This week is locked.');
      return;
    }

    // If pick already made, take no action
    if (oldTeam == team) return;

    // If old pick is already locked - no action
    if (pickObj.gameWeeks[this.gameWeek].locked) {
      this.showAlert("Too Late", "Your pick is already locked.");
      return;
    }

    // If new team is already locked
    if (game.locked) {
      this.showAlert("Invalid Pick", "The game is locked.");
    }

    // If user has picked team before
    if (pickObj.teams[team]) {
      this.showAlert('Invalid Pick', 'You already picked that team.');
      return;
    }
    
    // Pick is allowed
    this.userService.changePick(this.currentUserId, game, team, oldTeam,this.pickNumber);

    // Show alert with updated changes
    this.showAlert('Week ' + this.viewWeek, 'You selected the ' + this.teams[team].fullName + '.');
  }

  tapEvent(e) {
    var delta = e.deltaX;
    if (delta > 0) { // swipe left
      if (this.viewWeek > 1) this.changeView('back');
    }
    else { // swipe right
      if (this.viewWeek < 17) this.changeView('forward');
    }

  }

  buyPicks(numOfPick) {
    let confirm = this.alertCtrl.create({
      title: `Join the League`,
      message: `Please confirm that you want to buy ${numOfPick} pick(s) for $${numOfPick * 25}. Your payment is handled securely by Stripe. Pick'm will not see or save your payment information.`,
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
          }
        },
        {
          text: 'Buy a Pick',
          handler: () => {
            this.userService.openCheckout(numOfPick);
          }
        }
      ]
    });
    confirm.present();
    
  }

  

}
