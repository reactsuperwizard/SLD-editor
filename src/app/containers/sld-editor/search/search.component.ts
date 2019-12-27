import { Component, Input, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import * as go from 'gojs';

import { config } from '../config';

/**
 * the search-box component
 * dropdown like search used to quickly search and select specific widgets
 */
@Component({
    selector: 'sld-search',
    styleUrls: ['./search.component.scss'],
    templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit {

    public searchText = '';
    public searchResults = [];
    public hasFocus = false;
    public selectedIndex = 0;
    public scrollPosition = 0;

    @Input() diagram: go.Diagram;

    @ViewChild('searchDiv') searchContainerRef: ElementRef;
    @ViewChild('searchResultsDiv') searchResultsRef: ElementRef;

    public iconsPath = config.ASSETS_DIR + 'icons/';

    /**
     * the component init
     */
    ngOnInit() {
        // check for search box focus on mouse clicks
        const clickEventListener = e => {
            this.hasFocus = this.searchContainerRef.nativeElement.contains(e.target);
            if (this.hasFocus) {
                this.search();
            }
        };
        window.addEventListener('click', clickEventListener);
        window.addEventListener('contextmenu', clickEventListener);
        window.addEventListener('touchstart', clickEventListener);
    }

    /**
     * search
     * finds all components matching selected type + text by user
     * called on change of input
     */
    public search() {
        // reset search results
        this.searchResults = [];
        this.selectedIndex = 0;

        // if search text is empty, don't search
        if (!this.searchText || !this.searchText.length) {
            this.searchText = '';
            return;
        }

        const allEquipmentKeys = this.diagram.model.nodeDataArray
          .filter((nodeData: any) => !nodeData.category)
          .map((nodeData: any) => nodeData.key);

        // search without case-sensitive and '-' restrictions
        allEquipmentKeys.forEach((key: string) => {
            if (key.toLowerCase().replace('-', '').indexOf(this.searchText.toLowerCase().replace('-', '')) !== -1) {
                this.searchResults.push(key);
            }
        });
    }

    /**
     * go to component
     * find the node, select it and scroll diagram to it
     * before closing the dialog
     */
    public goToComponent(key) {
        // deselect all nodes in selection
        const selectedNodes = [];
        this.diagram.selection.each(node => {
            selectedNodes.push(node);
        });
        selectedNodes.forEach(node => {
            node.isSelected = false;
        });

        // select the chosen node and scroll to it
        const nodeToFind = this.diagram.findNodeForKey(key);
        this.diagram.select(nodeToFind);
        this.diagram.commandHandler.scrollToPart();

        this.searchText = '';
        this.selectedIndex = 0;
        this.searchResults = [];
        this.hasFocus = false;
    }

    /**
     * handle keyboard event
     * up / down and enter events
     */
    @HostListener('document:keydown', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (!this.hasFocus) { return; }
        if (event.key === 'ArrowUp') {
          this.handleKeyArrowUp();
        }
        if (event.key === 'ArrowDown') {
          this.handleKeyArrowDown();
        }
        if (event.key === 'Enter') {
          this.handleKeyEnter();
        }
    }

    /**
     * handle keyboard event arrow down
     * go down in drop down list
     */
    private handleKeyArrowDown() {
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.searchResults.length - 1);
        this.scrollToSelected();
    }

    /**
     * handle keyboard event arrow up
     * go up in drop down list
     */
    private handleKeyArrowUp() {
        this.selectedIndex = this.selectedIndex - 1;
        if (this.selectedIndex < 0) {
            this.selectedIndex = 0;
        }
        this.scrollToSelected();
    }

    /**
     * scroll to selected if needed
     * logic based on current scroll and row height
     */
    private scrollToSelected() {
        let scrollPosition = this.searchResultsRef.nativeElement.scrollTop;
        while ((scrollPosition + 196) < this.selectedIndex * 32) {
            scrollPosition += (scrollPosition % 32 ? (32 - scrollPosition % 32) : 32);
        }
        while (scrollPosition > this.selectedIndex * 32) {
            scrollPosition -= (scrollPosition % 32 ? scrollPosition % 32 : 32);
        }
        this.searchResultsRef.nativeElement.scrollTop = scrollPosition;
    }

    /**
     * handle keyboard event enter
     * find the selected component
     */
    private handleKeyEnter() {
        const selectedKey = this.searchResults[this.selectedIndex];
        if (!selectedKey) { return; }
        this.goToComponent(selectedKey);
    }
}
