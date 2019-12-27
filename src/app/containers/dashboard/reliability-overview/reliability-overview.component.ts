import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ApplicationService } from '../../../../services/application.service';

@Component({
  selector: 'app-reliability-overview',
  templateUrl: './reliability-overview.component.html',
  styleUrls: ['./reliability-overview.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ReliabilityOverviewComponent implements OnInit {

  loading = true;
  dailyStatus: any;
  completeness: number;
  assetsManufacture: any;

  constructor(private appService: ApplicationService) { }

  ngOnInit() {
    this.appService.getReliabilityCenterData().subscribe(res => {
      this.dailyStatus = res.dailyStatus;
      this.completeness = res.completeness;
      this.assetsManufacture = res.assetsManufacture;
      this.loading = false;
    });
  }
}
