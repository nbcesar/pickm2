import { Component, Input } from '@angular/core';
import { UserProvider } from '../../providers/user/user';

@Component({
  selector: 'league-user',
  templateUrl: 'league-user.html'
})
export class LeagueUserComponent {

  @Input('pick') pick: object;
  @Input('isCurrentUser') isCurrentUser: boolean;
  currentWeek: number;
  //weekString: string[] = ['gameWeek1','gameWeek2','gameWeek3','gameWeek4','gameWeek5','gameWeek6','gameWeek7','gameWeek8','gameWeek9','gameWeek10','gameWeek11','gameWeek12','gameWeek13','gameWeek14','gameWeek15','gameWeek16','gameWeek17'];

  constructor(
    public userService: UserProvider
  ) { 
   
  }

  ngOnInit() {
    this.currentWeek = this.userService.currentWeek.value;
  }

  // TODO: Implement a click that goes to the pick page for the correct pick & week.
}
