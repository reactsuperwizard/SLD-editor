import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {RiskMatrixValue} from '../../../components/risk-matrix/risk-matrix.component';
import {ApplicationService} from 'src/services/application.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {AddEditItemComponent} from '../modals/add-edit-item/add-edit-item.component';
import {DeleteAlertModalComponent} from '../modals/delete-alert-modal/delete-alert-modal.component';

const LOW_RISK_DEFAULT = 30;
const HIGH_RISK_DEFAULT = 70;


@Component({
  selector: 'app-project-entity',
  templateUrl: './project-entity.component.html',
  styleUrls: ['./project-entity.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProjectEntityComponent implements OnInit {
  loading = false;
  currentTab = 'tab-outage-type';
  riskMatrixMode = 'flexible';
  riskMode = 'medium';
  flexibleMode = true;
  userType = '';
  riskMatrixValue: RiskMatrixValue = {lowRisk: LOW_RISK_DEFAULT, highRisk: HIGH_RISK_DEFAULT};
  matrix = [];
  knowledgeBankDocs: Array<any> = [];
  knowledgeBankImages: Array<any> = [];

  constructor(private appSvc: ApplicationService,
              private route: ActivatedRoute,
              private modalService: NgbModal) {
  }

  ngOnInit() {
    this.userType = this.route.snapshot.data.userType;
    this.loading = true;
    this.appSvc.getRiskMatrix().subscribe(matrix => {
      this.matrix = matrix.riskMatrixFlexible;
      this.riskMatrixValue = matrix.riskMatrixAbsolute;
      this.appSvc.getAllKnowledgeBanks().subscribe(bank => {
        this.loading = false;
        this.knowledgeBankDocs = bank.docs;
        this.knowledgeBankImages = bank.images;
      });
    });
  }

  resetRiskMatrix() {
    this.riskMatrixValue = {lowRisk: LOW_RISK_DEFAULT, highRisk: HIGH_RISK_DEFAULT};
  }

  addOrEditNewKnowledgeBankItem(type: 'doc' | 'image', item: Object = null) {
    const modalRef = this.modalService.open(AddEditItemComponent, {centered: true});
    let title = item ? 'Edit ' : 'Add new ';
    title = title + (type === 'doc' ? 'document type' : 'image type');
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.data = item;
    modalRef.result.then(ret => {
      if (!item) {
        type === 'doc' ? this.knowledgeBankDocs.push(ret) : this.knowledgeBankImages.push(ret);
      } else if (ret === 'delete') {
        if (type === 'doc') {
          this.knowledgeBankDocs = this.knowledgeBankDocs.filter(doc => doc !== item);
        } else {
          this.knowledgeBankImages = this.knowledgeBankImages.filter(img => img !== item);
        }
      }
    }, () => {
    });
  }

  editSelectedKnowledgeBanks() {
    let selectedItems = this.knowledgeBankDocs.filter(item => item.selected);
    if (selectedItems.length > 0) {
      this.addOrEditNewKnowledgeBankItem('doc', selectedItems[0]);
    } else {
      selectedItems = this.knowledgeBankImages.filter(item => item.selected);
      if (selectedItems.length > 0) {
        this.addOrEditNewKnowledgeBankItem('image', selectedItems[0]);
      }
    }
  }

  getKnowledgeBankItemSelectedCount() {
    return this.knowledgeBankDocs.filter(item => item.selected).length
      + this.knowledgeBankImages.filter(item => item.selected).length;
  }

  deleteSelectedKnowledgeBanks() {
    const modalRef = this.modalService.open(DeleteAlertModalComponent, {centered: true});
    modalRef.componentInstance.deleteItemName = 'knowledge bank categories';
    modalRef.result.then(ret => {
      if (ret === 'delete') {
        this.knowledgeBankDocs = this.knowledgeBankDocs.filter(item => !item.selected);
        this.knowledgeBankImages = this.knowledgeBankImages.filter(item => !item.selected);
      }
    }, () => {
    });
  }
}
