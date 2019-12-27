import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { ApplicationService } from '../../../../services/application.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {
  public state: any = {
    validationFields: ['userName', 'surName', 'employer', 'jobPosition', 'email', 'telCode', 'phone', 'photo'],
    selectedRole: {},
    selectedRoleStatic: {},
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
    form: {
      userSkillsDTOList: [],
      telCode: '+1',
      photo: '../../../../assets/i/df-nu.svg',
      permissions: [

        {
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
  skillOpts$ = [];


  constructor(private appSvc: ApplicationService) { }

  ngOnInit() {
    this.appSvc.getRoles().subscribe(res => {
      this.state.roles = res;
      this.state.rolesList = res;
    });
    this.appSvc.getSkills().subscribe(res => {
      this.skillOpts$ = res;
    });
    this.lo = _;
  }

  showAddRole() {
    this.state.selectedRoleStatic = _.cloneDeep(this.state.selectedRole);
    this.state.isShowAddRole = true;
  }
  hideAddRole() {
    this.state.isShowAddRole = false;
  }
  saveAddRole() {
    this.state.selectedRole = _.cloneDeep(this.state.selectedRoleStatic);
    this.state.isShowAddRole = false;
  }

  hasSelectItems(itemList) {
    let hasSelected = false;
    Object.keys(this.state.selectedRoleStatic).forEach(key => {
      const item = this.state.selectedRoleStatic[key];
      if (item) {
        hasSelected = true;
      }
    });

    return hasSelected;
  }

  getSelectedRoleArray(obj) {
    const robj = _.cloneDeep(obj);
    _.keys(obj).map(key => {
      if (!obj[key]) {
        delete robj[key];
      }
      return obj;
    });

    return robj;

  }

  hasMaintainanceRole(obj) {
    let isValid = false;
    // checks if added roles contains 'Manitenance specialist'
    Object.keys(obj).map((item) => {
      const isSelected = obj[item];
      const role = _.keyBy(this.state.roles, 'roleId')[item];
      if (isSelected && role.roleName === 'Maintenance Specialist') {
        isValid = true;
      }
    });

    return isValid;

  }

  onSelectFile(event) {
    if (event.target.files && event.target.files[0]) {
      const reader = new FileReader();

      reader.readAsDataURL(event.target.files[0]); // read file as data url

      reader.onload = (e) => { // called once readAsDataURL is completed
        this.state.form.photo = e.target['result'];
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
  toggleCreateSkills(state) {
    this.state.showCreateSkills = state;
  }

  /* delete tag functions */
  toggleDelModal(state, index) {
    if (index) {
      this.state.delTag = { index: index };
    }
    this.state.showDelModal = state;
  }

  // confirmDeleteImgCatagory
  confirmDeleteTag(state) {
    this.skillOpts$.splice(this.state.delTag.index, 1);
    this.state.delTag = {};
    this.state.showDelModal = state;
  }



  validateForm() {
    let isValid = true;
    this.state.validationFields.forEach(item => {
      if (!this.state.form[item]) {
        isValid = false;
      }
    });

    if (_.keys(this.state.selectedRole).length <= 0) {
      isValid = false;
    }
    return isValid;
  }

  toggleSelectRole(item) {
    this.state.selectedRoleStatic[item.roleId] = !this.state.selectedRoleStatic[item.roleId];
  }

  toggleCreateExTeam(state) {
    this.state.showCreateNewExe = state;
  }

  toggleSucessMsg(state) {
    this.state.showSuccessModal = state;
  }

  assignToChange(val) {
    if (val === 'create-new') {

      this.toggleCreateExTeam(true);
    }
  }


  // onPressReturn
  onPressReturn(e) {
    const inputVal = document.querySelector('.skills-dd input')['value'];
    const textVal = document.querySelector('.skills-dd .ng-dropdown-panel .ng-option').textContent;
    document.querySelector('.skills-dd input')['value'] = '';
    const id = this.skillOpts$.length + 99;
    if (textVal && textVal === 'No items found') {
      const skillObj = {
        'skillId': id,
        'skillName': inputVal,
        'skillLevel': 'NA',
        'skillCertificate': 'NA',
        'userId': 4,
        'userName': 'NA',
        'employer': null,
        'jobPosition': null,
        'email': 'test@wipro.com',
        'phone': null,
        'certificateExpiry': '2018-11-03T00:00:00',
        'certificate': 1
      };
      window.setTimeout(() => {
        this.skillOpts$.push(skillObj);
      }, 100);
      window.setTimeout(() => {
        /* tslint:disable */
        const optList: HTMLElement = document.querySelectorAll('.skills-dd .ng-dropdown-panel .ng-option-label')[document.querySelectorAll('.skills-dd .ng-dropdown-panel .ng-option-label').length - 1] as HTMLElement;
        optList.click();
        /* tslint:enable */
      }, 110);
      this.toggleCreateSkills(true);
    }
  }

  // hasSelectedRole
  hasSelectedRole(roleObj) {
    let isValid = false;
    Object.keys(roleObj).map(key => {
      const role = roleObj[key];
      if (role === true) {
        isValid = true;
      }
    });
    return isValid;
  }


  // getSkillFromId
  getSkillFromId(skills) {
    const skillList = skills ? skills : [];
    const skillsArray = [];
    skillList.map(item => {
      const skill = _.keyBy(this.skillOpts$, 'skillId')[item];
      return skillsArray.push(skill);
    });
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
