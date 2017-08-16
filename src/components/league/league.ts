import { Component } from '@angular/core';

import { UserProvider } from '../../providers/user/user';

@Component({
  selector: 'league',
  templateUrl: 'league.html'
})
export class LeagueComponent {

  usersObj: any;
  users: any[] = [];
  usersAlive: number = 0;
  currentUserId: any;
  currentUserPicks: any[] = [];

  pot: string = '$500';

  constructor(
    public userService: UserProvider
  ) {
    
  }

  ngOnInit() {
    
    this.userService.currentUserId.subscribe(
      value => {
        this.currentUserId = value;
      },
      error => {
        console.log(error);
      }
    );

    this.userService.usersData.subscribe(
      value => {
        this.usersObj = value;
        this.getUsersList();
      },
      error => {
        console.log(error);
      }
    );
  }

  getUsersList() {
    // Turn the users object to an array of picks 
    this.users = [];
    this.currentUserPicks = [];
    this.usersAlive = 0;
    for (var user in this.usersObj) {
      let userName = this.usersObj[user].userName;
      let picks = this.usersObj[user].picks;
      let pickCount = 1;
      if (picks) {
        picks.forEach(pick => {
          let pickObj = pick;
          pickObj.userName = userName;
          pickObj.pickNumber = pickCount;
          pickCount++;
          if (pick.alive) this.usersAlive++;
          if (pick.alive && user != this.currentUserId) {
            this.users.unshift(pickObj);
          }
          else if (!pick.alive && user != this.currentUserId) {
            // Uncomment to show dead users
            //this.users.push(pickObj);
          }
          else {
            this.currentUserPicks.push(pickObj);
          }
        });
      }
    }
    this.pot = this.usersAlive > 20 ? `Pot: $${this.usersAlive * 25}` : 'Pot: $500'; 
  }

}
