import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-member-privilege',
  templateUrl: './member-privilege.component.html',
  styleUrls: ['./member-privilege.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MemberPrivilegeComponent implements OnInit {

  public userType: string;

  constructor(private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.userType = this.activatedRoute.snapshot.data.userType;
  }
}
