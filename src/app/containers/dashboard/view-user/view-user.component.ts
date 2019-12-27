import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import {ApplicationService} from '../../../../services/application.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-view-user',
  templateUrl: './view-user.component.html'
})
export class ViewUserComponent implements OnInit {
  public state: any = {
    validationFields: ['userName', 'surName', 'employer', 'jobPosition', 'email', 'telCode', 'phone', 'photo'],
    selectedRole: {},
    createNewExecutionTeam: {},
    manageSkill: {
      selectedSkill: {},
      loe: {
        value: 2,
        options: {
          showSelectionBar: true,
          floor: 1,
          ceil: 3
        }
      }
    },
    singleUserDetails: {},
    form: {
      telCode: '+1',
      photo: '../../../../assets/i/df-nu.svg',
      permissions: [{
        id: 1,
        permissionName: 'System',
        enabled: false,
        permissionList: [{
          name: 'Users & Roles',
          isEnabled: false
        }, {
          name: 'Execution Teams',
          isEnabled: false
        }, {
          name: 'Risk Matrix',
          isEnabled: false
        }, {
          name: 'Knowledge Bank',
          isEnabled: false
        }]
      }, {
        id: 2,
        permissionName: 'Project',
        enabled: true,
        permissionList: [{
          name: 'Project Definition',
          isEnabled: true
        }, {
          name: 'GIS',
          isEnabled: true
        }, {
          name: 'SLD Modelling',
          isEnabled: true
        }, {
          name: 'Outage Areas',
          isEnabled: true
        }, {
          name: 'Budget Areas',
          isEnabled: true
        }]
      }, {
        id: 3,
        permissionName: 'Planning',
        enabled: true,
        permissionList: [{
            name: 'Constrain Definition',
            isEnabled: true
          },
          {
            name: 'Task Navigator',
            isEnabled: true
          }]
      }],
      assignTo: [
        {
          id: 1,
          value: 'Banden 1'
        },
        {
          id: 2,
          value: 'Banden 2'
        },
        {
          id: 3,
          value: 'Zurich 1'
        }
      ],
      currency: 'USD'
    },
    items: [1, 2, 3],
    slideOpts: {
      items: 5,
      dots: false,
    },
    showManageSkills: false
  };
  lo: any;
  skillOpts$: Observable<any[]>;
  constructor(private appSvc: ApplicationService) { }

  ngOnInit() {
    this.appSvc.getSkills().subscribe(res => {
      this.skillOpts$ = res;
    });
    this.appSvc.getSingleUserDetails().subscribe(res => {
      this.state.form = { ...this.state.form, ...res[0] };
    });
    this.appSvc.getRoles().subscribe(res => {
      this.state.roles = res;
    });
    this.lo = _;
  }

  showAddRole() {
    this.state.isShowAddRole = true;
  }
  hideAddRole() {
    this.state.isShowAddRole = false;
  }

  onSelectFile(event) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();

      reader.readAsDataURL(event.target.files[0]); // read file as data url

      reader.onload = (e) => { // called once readAsDataURL is completed
        this.state.userThumbUrl = event.target['result'];
      };
    }
  }

  unSelectRole(item) {
    delete this.state.selectedRole[item];
  }

  togglePermisson(state) {
    this.state.isShowManagePermissions = state;
  }
  toggleManageSkill(state, selectedSkill) {
    this.state.manageSkill.selectedSkill = selectedSkill;
    this.state.showManageSkill = state;
  }
  toggleManageSkills(state) {
    this.state.showManageSkills = state;
  }

  validateForm() {
    let isValid = true;
    this.state.validationFields.forEach(item => {
      if (!this.state.form[item]) {
        isValid = false;
      }
    });
    return isValid;
  }

  toggleSelectRole(item) {
    this.state.selectedRole[item.roleId] = !this.state.selectedRole[item.roleId];
  }

  toggleCreateExTeam(state) {
    this.state.showCreateNewExe = state;
  }

  assignToChange(val) {
    if (val === 'create-new') {
      this.toggleCreateExTeam(true);
    }
  }

  // getSkillFromId
  getSkillFromId(skills) {
    const skillList = skills ? _.cloneDeep(skills) : [];
    const skillsArray = [];
    if (this.skillOpts$) {
      skillList.map(item => {
        const skill = _.keyBy(this.skillOpts$, 'skillId')[item];
        return skillsArray.push(skill);
      });
    }
    // debugger;
    return skillsArray;

  }

  removeSkillTag(removeItem) {
    let removeIndex = removeItem.skillId;
    this.state.form.userSkillsDTOList.map((item, i) => {
      if (item === removeIndex) {
        removeIndex = i;
      }
    });
    if (removeIndex > -1) {
      this.state.form.userSkillsDTOList.splice(removeIndex, 1);
      const sa = _.cloneDeep(this.state.form.userSkillsDTOList);
      this.state.form.userSkillsDTOList = sa;
    }
  }

}
