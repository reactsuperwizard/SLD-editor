import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-create-connection-modal',
  templateUrl: './create-connection-modal.component.html',
  styleUrls: ['./create-connection-modal.component.scss']
})
export class CreateConnectionModalComponent implements OnInit {
  @Input() connections = [];
  localConnections = [];
  @Input() types = [];

  constructor(public activeModal: NgbActiveModal) {
  }

  ngOnInit() {
    this.localConnections = [...this.connections];
  }

  /**
   * Change connection source
   * @param value - newvalue
   * @param id - connection id
   */
  changeSource(value, id) {
    this.localConnections = this.localConnections.map(function (connection) {
      if (connection.id === id) {
        connection.source = value;
      }
      return connection;
    });
  }

  /**
   * Delete all connections
   */
  deleteAll() {
    this.localConnections = this.localConnections.map(function (connection) {
      connection.removed = true;
      return connection;
    });
    this.activeModal.close({type: 'confirm', data: this.localConnections});
  }

  /**
   * Remove specific connection
   * @param id - connection id
   */
  remove(id) {
    this.localConnections = this.localConnections.map(function (connection) {
      if (connection.id === id) {
        connection.removed = true;
      }
      return connection;
    });
  }

  /**
   * Save connection
   */
  confirm() {
    this.activeModal.close({type: 'confirm', data: this.localConnections});
  }

  /**
   * close connection
   */
  close() {
    this.activeModal.close({type: 'close'});
  }

}
