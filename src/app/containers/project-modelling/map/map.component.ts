import {Component, OnInit} from '@angular/core';
import * as uuid from 'uuid';
import {first} from 'rxjs/operators';
import findLast from 'lodash/findLast';
import {ApplicationService} from '../../../../services/application.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {CreateSubstationModalComponent} from '../modal/create-substation-modal/create-substation-modal.component';
import {CreateConnectionModalComponent} from '../modal/create-connection-modal/create-connection-modal.component';

declare var ol: any;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  editSubStation: any = false;
  addSubStation: any = false;
  addJoint: any = false;
  selectedFeature: any = null;
  selectedMarker: any = null;
  hoverOverMarker: any = null;
  hoverOverJoint: any = null;
  hoverOverConnection: any = null;
  focusedCountry = 'CHE';
  legend = true;
  legendQuery = '';
  mapData: any = {};
  masterData: any = {};
  map: any;
  dragStart = false;
  enableForConnect = false;

  mapStyle = new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, .8)'
    }),
    stroke: new ol.style.Stroke({
      color: '#B4B4B4',
      width: 2
    }),
    text: new ol.style.Text({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0)'
      })
    })
  });

  lineStyle = new ol.style.Style({
    fill: new ol.style.Fill({
      color: 'rgba(255, 255, 255, 1)'
    }),
    stroke: new ol.style.Stroke({
      color: '#BABABA',
      width: 2,
      lineDash: [.5, 5]
    })
  });

  connectionLineStyle = new ol.style.Style({
    fill: new ol.style.Fill({
      color: '#bababa'
    }),
    stroke: new ol.style.Stroke({
      color: '#bababa',
      width: 5,
    })
  });

  connectionLineDarkStyle = new ol.style.Style({
    fill: new ol.style.Fill({
      color: '#a7a7a7'
    }),
    stroke: new ol.style.Stroke({
      color: '#a7a7a7',
      width: 5,
    })
  });

  connectionLineHoverStyle = new ol.style.Style({
    fill: new ol.style.Fill({
      color: '#7f7f7f'
    }),
    stroke: new ol.style.Stroke({
      color: '#7f7f7f',
      width: 5,
    })
  });

  highlightStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#BABABA',
      width: 1
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255,255,255,0.1)'
    })
  });

  highlightJointStyle = new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: '#89A9FF',
      width: 1
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255,255,255,0.1)'
    })
  });

  marker = new ol.style.Style({
    image: new ol.style.Icon(({
      crossOrigin: 'anonymous',
      src: '/assets/i/marker.svg',
      imgSize: [56, 56]
    }))
  });

  joint = new ol.style.Style({
    image: new ol.style.Icon(({
      crossOrigin: 'anonymous',
      src: '/assets/i/joint.svg',
      imgSize: [62, 62]
    }))
  });

  jointHover = new ol.style.Style({
    image: new ol.style.Icon(({
      crossOrigin: 'anonymous',
      src: '/assets/i/joint-hover.svg',
      imgSize: [62, 62]
    }))
  });

  markerHover = new ol.style.Style({
    image: new ol.style.Icon(({
      crossOrigin: 'anonymous',
      src: '/assets/i/marker-hover.svg',
      imgSize: [72, 72]
    }))
  });

  vectorSource = new ol.source.Vector({
    url: '/assets/data/countries.geojson',
    format: new ol.format.GeoJSON()
  });

  tileLayer = new ol.layer.Tile({
    source: new ol.source.OSM()
  });

  mapLayer = new ol.layer.Vector({
    source: this.vectorSource,
    style: this.mapStyle
  });


  markerLayer = new ol.layer.Vector({
    source: new ol.source.Vector({}),
    style: this.mapStyle
  });

  linesLayer = new ol.layer.Vector({
    source: new ol.source.Vector({}),
    style: this.lineStyle
  });

  dragLinesLayer = new ol.layer.Vector({
    source: new ol.source.Vector({}),
    style: this.lineStyle
  });

  highlightLinesLayer = new ol.layer.Vector({
    source: new ol.source.Vector({useSpatialIndex: false}),
    style: this.connectionLineStyle
  });

  connectionLayer = new ol.layer.Vector({
    source: new ol.source.Vector({}),
    style: this.connectionLineDarkStyle
  });

  selectedCountryLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: this.highlightStyle
  });

  overlayLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(0, 0, 0, .75)'
      })
    })
  });

  mouseLayer = new ol.layer.Vector({
    source: new ol.source.Vector(),
  });

  overlay = new ol.Feature({
    geometry: new ol.geom.Polygon([
      [ol.proj.fromLonLat([-180, -85]),
        ol.proj.fromLonLat([-180, 85]),
        ol.proj.fromLonLat([180, 85]),
        ol.proj.fromLonLat([180, -85]),
        ol.proj.fromLonLat([-180, -85])]])
  });

  // make makers dragable
  Drag: any = (function (PointerInteraction, that) {
    const Drag: any = function () {
      PointerInteraction.call(this, {
        handleDownEvent: function (evt) {
          const map = evt.map;
          if (!that.enableForConnect) {
            return false;
          }
          const feature = map.forEachFeatureAtPixel(evt.pixel,
            function (f) {
              const properties = f.getProperties();
              if (properties && (properties.markerType === 'Marker')) {
                return f;
              }
            });

          if (feature) {
            this.feature_ = feature;
            that.dragLinesLayer.getSource().clear();
            that.markerLayer.getSource().getFeatures().forEach(function (marker) {
              const startCoordinate = marker.getGeometry().getFirstCoordinate();
              const endCoordinate = feature.getGeometry().getFirstCoordinate();
              let coordinates = [startCoordinate, endCoordinate];
              const middleCoordinate = that.getMiddleCoordinate(startCoordinate, endCoordinate);
              if (middleCoordinate.length > 0) {
                coordinates = [startCoordinate, middleCoordinate, endCoordinate];
              }
              const line = new ol.Feature({
                geometry: new ol.geom.LineString(coordinates),
                name: 'Line'
              });
              that.dragLinesLayer.getSource().addFeature(line);
            });
          }
          return !!feature;
        },
        handleDragEvent: function (evt) {
          that.dragStart = true;
          that.highlightLinesLayer.getSource().clear();
          const id = this.feature_.getId();
          const feature = that.markerLayer.getSource().getClosestFeatureToCoordinate(evt.coordinate,
            function (f) {
              const properties = f.getProperties();
              if ((properties.markerType === 'Marker' || properties.markerType === 'Joint') && f.getId() !== id) {
                return f;
              }
            });
          const dashLineFeature = that.dragLinesLayer.getSource() ?
            that.dragLinesLayer.getSource().getClosestFeatureToCoordinate(evt.coordinate,
              function (f) {
                return f;
              }) : null;
          if (feature && dashLineFeature) {
            that.highlightLinesLayer.getSource().clear();
            const closestPoint = dashLineFeature.getGeometry().getClosestPoint(evt.coordinate);
            const startCoordinate = this.feature_.getGeometry().getFirstCoordinate();
            let coordinates = [startCoordinate, closestPoint];
            const middleCoordinate = that.getMiddleCoordinate(closestPoint, startCoordinate);
            if (middleCoordinate.length > 0) {
              coordinates = [startCoordinate, middleCoordinate, closestPoint];
            }
            const line = new ol.Feature({
              geometry: new ol.geom.LineString(coordinates),
              name: 'Highlight Line'
            });
            line.setId('HighlightLine');
            that.highlightLinesLayer.getSource().addFeature(line);
          }
        },
        handleUpEvent: function () {
          that.dragStart = false;
          that.dragLinesLayer.getSource().clear();
          const highlightLine = that.highlightLinesLayer.getSource().getFeatureById('HighlightLine');
          if (highlightLine) {
            const lastCoordinate = highlightLine.getGeometry().getLastCoordinate();
            let delta = 10;
            let closest = null;
            that.markerLayer.getSource().getFeatures().forEach(function (f) {
              const firstCoordinate = f.getGeometry().getFirstCoordinate();
              const deltaX = Math.abs(firstCoordinate[0] - lastCoordinate[0]);
              const deltaY = Math.abs(firstCoordinate[1] - lastCoordinate[1]);
              if (delta > deltaX + deltaY) {
                delta = deltaX + deltaY;
                closest = f;
              }
            });
            if (closest) {
              const id1 = this.feature_.getId() + '=' + closest.getId();
              const id2 = closest.getId() + '=' + this.feature_.getId();
              if (!(that.connectionLayer.getSource().getFeatureById(id1) !== null ||
                that.connectionLayer.getSource().getFeatureById(id2) !== null
              )) {
                const startCoordinate1 = this.feature_.getGeometry().getFirstCoordinate();
                const endCoordinate1 = closest.getGeometry().getFirstCoordinate();
                const middleCoordinate = that.getMiddleCoordinate(endCoordinate1, startCoordinate1);
                let points = [
                  startCoordinate1,
                  endCoordinate1
                ];
                if (middleCoordinate.length > 0) {
                  points = [
                    endCoordinate1,
                    middleCoordinate,
                    startCoordinate1
                  ];
                }
                const line = new ol.Feature({
                  geometry: new ol.geom.LineString(points),
                  name: 'Connection Line',
                  source: 'Source',
                  reference: 'SR-001',
                  origin: this.feature_.getId(),
                  destination: closest.getId()
                });
                line.setId(id1);
                that.connectionLayer.getSource().addFeature(line);
              }
            }
          }
          // that.overlayLayer.getSource().clear();
          that.highlightLinesLayer.getSource().clear();
          this.feature_ = null;
          return false;
        }
      });

      this.feature_ = null;
      return this;
    };

    if (PointerInteraction) {
      Drag.__proto__ = PointerInteraction;
    }
    Drag.prototype = Object.create(PointerInteraction && PointerInteraction.prototype);
    Drag.prototype.constructor = Drag;

    return Drag;
  }(ol.interaction.Pointer, this));


  constructor(private dataService: ApplicationService, private modalService: NgbModal) {
  }

  ngOnInit() {
    this.dataService.getMasterData()
      .pipe(first())
      .subscribe(this.setMasterData.bind(this), (error) => {
      });
    const $that = this;
    this.dataService.getMapMarkers()
      .pipe(first())
      .subscribe((mapData) => {
        this.mapData = mapData;
        this.focusedCountry = mapData.country;
        this.mapLayer.setZIndex(3);
        this.mouseLayer.setZIndex(5);
        this.overlayLayer.setZIndex(5);
        this.linesLayer.setZIndex(8);
        this.dragLinesLayer.setZIndex(8);
        this.highlightLinesLayer.setZIndex(9);
        this.connectionLayer.setZIndex(9);
        this.markerLayer.setZIndex(10);
        this.map = new ol.Map({
          interactions: ol.interaction.defaults().extend([new this.Drag()]),
          target: 'map',
          controls: [],
          layers: [
            // this.tileLayer,
            this.mapLayer,
            this.markerLayer,
            this.mouseLayer,
            this.linesLayer,
            this.dragLinesLayer,
            this.highlightLinesLayer,
            this.selectedCountryLayer,
            this.connectionLayer,
            this.overlayLayer,
          ],
          view: new ol.View({
            center: ol.proj.fromLonLat([73.8567, 18.5204]),
            zoom: 8
          })
        });
        this.map.on('click', this.onClickMap.bind(this));
        this.map.on('pointermove', this.markerHoverEvent.bind(this));
        this.vectorSource.on('change', function () {
          $that.focus();
        });
        this.loadDataFromJSON(mapData);
      }, (error) => {
        console.log(error);
      });
  }

  loadDataFromJSON(json) {
    this.addSubStation = true;
    json.markers.forEach((marker) => {
      this.onClickMap(marker, true);
    });
    const $that = this;
    this.addSubStation = false;
    json.connections.forEach((connection) => {
      const origin = findLast(json.markers, {id: connection.props.origin});
      const destination = findLast(json.markers, {id: connection.props.destination});
      const middleCoordinate = $that.getMiddleCoordinate(destination.coordinate, origin.coordinate);
      let points = [
        origin.coordinate,
        destination.coordinate
      ];
      if (middleCoordinate.length > 0) {
        points = [
          origin.coordinate,
          middleCoordinate,
          destination.coordinate
        ];
      }
      const line = new ol.Feature({
        geometry: new ol.geom.LineString(points),
        name: connection.props.name,
        source: connection.props.source,
        reference: connection.props.reference,
        origin: connection.props.origin,
        destination: connection.props.destination
      });
      line.setId(connection.props.id);
      if (connection.props.source === 'Load') {
        line.setStyle(this.connectionLineStyle);
      } else {
        line.setStyle(this.connectionLineDarkStyle);
      }
      this.connectionLayer.getSource().addFeature(line);
    });
  }

  /**
   * Set Master data
   * @param data - master data
   */
  setMasterData(data) {
    this.masterData = data;
  }

  /**
   * Add new sub station
   */
  addSubStationEvent() {
    this.addSubStation = !this.addSubStation;
    this.addJoint = false;
    this.selectedCountryLayer.setStyle(this.highlightStyle);
    this.mouseLayer.getSource().clear();
  }

  /**
   * Add new joint
   */
  addJointEvent() {
    this.addSubStation = false;
    this.addJoint = !this.addJoint;
    if (this.addJoint) {
      this.selectedCountryLayer.setStyle(this.highlightJointStyle);
    } else {
      this.selectedCountryLayer.setStyle(this.highlightStyle);
      this.mouseLayer.getSource().clear();
    }
  }

  enableConnections() {
    if (this.isPossibleToConnect()) {
      this.addSubStation = false;
      this.addJoint = false;
      this.enableForConnect = !this.enableForConnect;
      this.overlayLayer.getSource().clear();
      if (this.enableForConnect) {
        this.overlayLayer.getSource().addFeature(this.overlay);
      }
    }
  }

  /**
   * Add new connection
   * @param id - id
   */
  addConnection(id) {
    const modalRef = this.modalService.open(CreateConnectionModalComponent, {centered: true, size: 'lg'});
    modalRef.componentInstance.connections = this.getConnections(id);
    modalRef.componentInstance.types = this.masterData.connectionTypes || [];
    modalRef.result.then(ret => {
      if (ret.type === 'confirm') {
        this.saveConnection(ret.data);
      } else {
        this.closePopup();
      }
    }, () => {
      this.closePopup();
    });
  }

  /**
   * Zoom out
   */
  zoomOut() {
    this.map.getView().setZoom(this.map.getView().getZoom() - 1);
  }

  /**
   * Zoom In
   */
  zoomIn() {
    this.map.getView().setZoom(this.map.getView().getZoom() + 1);
  }

  /**
   * Focus country area
   */
  focus() {
    const $that = this;
    const source = $that.mapLayer.getSource();
    $that.selectedCountryLayer.setZIndex(3);
    $that.selectedCountryLayer.getSource().clear();
    const feature = source.getFeatureById($that.focusedCountry);
    $that.selectedCountryLayer.getSource().addFeature(feature);
    $that.selectedFeature = feature;
    $that.map.getView().fit(feature.getGeometry(), $that.map.getSize());
  }

  /**
   * Click event on map
   * @param args - event
   * @param fromJSON - loading from json data
   */
  onClickMap(args, fromJSON) {
    this.mouseLayer.getSource().clear();
    // this.overlayLayer.getSource().clear();
    if (this.addSubStation) { // check add sub station is active
      const coords = args.coordinate;
      let isInside = true;
      if (!fromJSON) {
        const polygonGeometry = this.selectedFeature.getGeometry();
        isInside = polygonGeometry.intersectsCoordinate(coords);
      }
      const lonlat = ol.proj.transform(coords, 'EPSG:3857', 'EPSG:4326');
      if (isInside) {
        const marker = new ol.Feature({
          markerType: 'Marker',
          longitude: lonlat[0],
          latitude: lonlat[1],
          geometry: new ol.geom.Point(coords),
        });
        marker.setId((args.props && args.props.id) || uuid.v1());
        marker.setStyle(this.marker);
        const d = new Date();
        marker.setProperties({
          possibilityToExtend: '',
          voltageLevel: '',
          switchgear: '',
          commisioningYear: d.getFullYear(),
          installationYear: d.getFullYear(),
          ...args.props
        });
        this.markerLayer.getSource().addFeature(marker);
        this.selectedMarker = marker;
        if (!fromJSON) {
          this.openCreateSubStationModal();
        }

      }
    } else if (this.addJoint) { // check add joint is active
      this.addJoint = false;
      this.selectedCountryLayer.setStyle(this.highlightStyle);
      const polygonGeometry = this.selectedFeature.getGeometry();
      const coords = args.coordinate;
      const closestPoint = polygonGeometry.getClosestPoint(coords);
      const marker = new ol.Feature({
        markerType: 'Joint',
        name: 'Joint',
        geometry: new ol.geom.Point(closestPoint),
      });
      marker.setId(uuid.v1());
      marker.setStyle(this.joint);
      this.markerLayer.getSource().addFeature(marker);
    } else {
      const feature = this.map.forEachFeatureAtPixel(args.pixel, function (f) {
        const properties = f.getProperties();
        if (properties && properties.markerType === 'Marker' || properties.name === 'Connection Line') {
          return f;
        }
      });
      if (feature) {
        const properties = feature.getProperties();
        if (properties && properties.markerType === 'Marker') {
          this.selectedMarker = feature;
          this.editSubStation = true;
          this.openCreateSubStationModal();
        } else if (properties && properties.name === 'Connection Line') {
          this.addConnection(feature.getId());
        }
      }
    }
  }

  openCreateSubStationModal() {
    const modalRef = this.modalService.open(CreateSubstationModalComponent, {centered: true, size: 'lg'});
    modalRef.componentInstance.marker = this.selectedMarker;
    modalRef.componentInstance.masterData = this.masterData;
    modalRef.componentInstance.edit = this.editSubStation;
    modalRef.result.then(ret => {
      if (ret.type === 'delete') {
        this.deleteMarker(ret.data);
      } else if (ret.type === 'save') {
        this.saveMarker(ret.data);
      } else {
        this.closePopup();
      }
    }, () => {
      this.closePopup();
    });
  }

  getMiddleCoordinate(startCoordinate, endCoordinate) {
    const x = endCoordinate[1] - startCoordinate[1];
    const y = endCoordinate[0] - startCoordinate[0];
    const degrees = 180 + Math.atan2(y, x) * (180 / Math.PI);
    console.log(degrees);
    if (degrees < 45) {
      return [startCoordinate[0], endCoordinate[1] + (startCoordinate[0] - endCoordinate[0])];
    } else if (degrees === 45) {
      return [];
    } else if (degrees > 45 && degrees < 90) {
      return [endCoordinate[0] + (startCoordinate[1] - endCoordinate[1]), startCoordinate[1]];
    } else if (degrees === 90) {
      return [];
    } else if (degrees > 90 && degrees < 135) {
      return [endCoordinate[0] - (startCoordinate[1] - endCoordinate[1]), startCoordinate[1]];
    } else if (degrees === 135) {
      return [];
    } else if (degrees > 135 && degrees < 180) {
      return [startCoordinate[0], endCoordinate[1] - (startCoordinate[0] - endCoordinate[0])];
    } else if (degrees === 180) {
      return [];
    } else if (degrees > 180 && degrees < 225) {
      return [startCoordinate[0], endCoordinate[1] + (startCoordinate[0] - endCoordinate[0])];
    } else if (degrees === 225) {
      return [];
    } else if (degrees > 225 && degrees < 270) {
      return [endCoordinate[0] + (startCoordinate[1] - endCoordinate[1]), startCoordinate[1]];
    } else if (degrees === 270) {
      return [];
    } else if (degrees > 270 && degrees < 315) {
      return [endCoordinate[0] - (startCoordinate[1] - endCoordinate[1]), startCoordinate[1]];
    } else if (degrees === 315) {
      return [];
    } else if (degrees > 315 && degrees < 360) {
      return [startCoordinate[0], endCoordinate[1] - (startCoordinate[0] - endCoordinate[0])];
    } else if (degrees === 260 || degrees === 0) {
      return [];
    }
    return [];
  }

  /**
   * Hover over marker
   * e - position
   */
  markerHoverEvent(e) {
    if (this.addSubStation || this.addJoint) {
      const marker = new ol.Feature({
        geometry: new ol.geom.Point(e.coordinate),
      });
      this.mouseLayer.setStyle(new ol.style.Style({
        image: new ol.style.Icon(({
          crossOrigin: 'anonymous',
          imgSize: this.addSubStation ? [60, 72] : [60, 75],
          src: this.addSubStation ? '/assets/i/mouse-pin.svg' : '/assets/i/joint-mouse-pin.svg'
        }))
      }));
      marker.setId(marker);
      this.mouseLayer.getSource().clear();
      this.mouseLayer.getSource().addFeature(marker);
    }
    const feature = this.map.forEachFeatureAtPixel(e.pixel, function (f) {
      const properties = f.getProperties();
      if (properties && (properties.markerType === 'Marker'
        || properties.markerType === 'Joint'
        || properties.name === 'Connection Line')) {
        return f;
      }
    });
    if (feature) {
      const properties = feature.getProperties();
      if (properties && properties.markerType === 'Marker' && this.dragStart === false) {
        feature.setStyle(this.markerHover);
        this.hoverOverMarker = feature;
        this.linesLayer.getSource().clear();
        const $that = this;
        this.markerLayer.getSource().getFeatures().forEach(function (marker) {
          const endCoordinate = feature.getGeometry().getFirstCoordinate();
          const startCoordinate = marker.getGeometry().getFirstCoordinate();
          let coordinates = [startCoordinate, endCoordinate];
          if (endCoordinate && startCoordinate) {
            const middleCoordinate = $that.getMiddleCoordinate(startCoordinate, endCoordinate);
            if (middleCoordinate.length > 0) {
              coordinates = [startCoordinate, middleCoordinate, endCoordinate];
            }
          }
          const line = new ol.Feature({
            geometry: new ol.geom.LineString(coordinates),
            name: 'Line'
          });
          if ($that.enableForConnect === true) {
            $that.linesLayer.getSource().addFeature(line);
          }
        });
      } else if (properties && properties.markerType === 'Joint') {
        this.hoverOverJoint = feature;
        feature.setStyle(this.jointHover);
      } else if (properties && properties.name === 'Connection Line') {
        this.hoverOverConnection = feature;
        this.hoverOverConnection.setStyle(this.connectionLineHoverStyle);
      }
    } else {
      if (this.hoverOverMarker) {
        this.hoverOverMarker.setStyle(this.marker);
        this.hoverOverMarker = null;
      }
      if (this.hoverOverJoint) {
        this.hoverOverJoint.setStyle(this.joint);
        this.hoverOverJoint = null;
      }
      if (this.hoverOverConnection) {
        const p = this.hoverOverConnection.getProperties();
        if (p.source === 'Load') {
          this.hoverOverConnection.setStyle(this.connectionLineStyle);
        } else {
          this.hoverOverConnection.setStyle(this.connectionLineDarkStyle);
        }
        this.hoverOverConnection = null;
      }
      this.linesLayer.getSource().clear();
    }
  }

  /**
   * Save marker
   * @param values - Marker values
   */
  saveMarker(values) {
    const feature = this.markerLayer.getSource().getFeatureById(values.id);
    feature.setProperties(values);
    this.addSubStation = false;
    this.editSubStation = false;
    this.mouseLayer.getSource().clear();
  }

  /**
   * Delete marker
   * @param id - id
   */
  deleteMarker(id) {
    const $that = this;
    const feature = this.markerLayer.getSource().getFeatureById(id);
    this.markerLayer.getSource().removeFeature(feature);
    this.connectionLayer.getSource().getFeatures().forEach(function (f) {
      if (f.getId().indexOf(id) !== -1) {
        $that.connectionLayer.getSource().removeFeature(f);
      }
    });
    this.addSubStation = false;
    this.editSubStation = false;
    this.mouseLayer.getSource().clear();
  }

  /**
   * Close popup
   */
  closePopup() {
    this.editSubStation = false;
  }

  /**
   * Get all makers
   * @returns - all makers
   */
  getMarkers() {
    const subStations = [];
    const $that = this;
    this.markerLayer.getSource().getFeatures().forEach(function (feature) {
      if (feature.get('markerType') !== 'Joint') {
        subStations.push({
          id: feature.getId(),
          name: feature.get('name'),
          region: feature.get('region'),
          visible: ($that.legendQuery === '' || feature.get('name').toLowerCase().indexOf($that.legendQuery.toLowerCase()) !== -1)
        });
      }
    });
    return subStations;
  }

  isSubStainsNotAvailable() {
    return (this.markerLayer.getSource().getFeatures().length === 0);
  }

  isPossibleToConnect() {
    return this.markerLayer.getSource().getFeatures().length > 1;
  }

  /**
   * Get all connections
   * @param id - id
   * @returns - connections
   */
  getConnections(id) {
    const connections = [];
    const $that = this;
    this.connectionLayer.getSource().getFeatures().forEach(function (feature) {
      const properties = feature.getProperties();
      const ids = feature.getId().split('=');
      const dest = $that.markerLayer.getSource().getFeatureById(ids[1]);
      const ori = $that.markerLayer.getSource().getFeatureById(ids[0]);
      if (id === feature.getId()) {
        connections.push({
          id: feature.getId(),
          reference: properties.reference,
          source: properties.source,
          origin: ori ? ori.getProperties().name : '',
          destination: dest ? dest.getProperties().name : ''
        });
      }
    });
    return connections;
  }

  /**
   * Save connection
   * @param connections - connections
   */
  saveConnection(connections) {
    const $that = this;
    connections.forEach(function (connection) {
      if (connection.removed) {
        const feature = $that.connectionLayer.getSource().getFeatureById(connection.id);
        $that.connectionLayer.getSource().removeFeature(feature);
      } else {
        const feature = $that.connectionLayer.getSource().getFeatureById(connection.id);
        feature.setProperties({source: connection.source});
        if (connection.source === 'Load') {
          feature.setStyle($that.connectionLineStyle);
        } else {
          feature.setStyle($that.connectionLineDarkStyle);
        }
      }
    });
  }

  /**
   * Search markers
   * @param value - search text
   */
  search(value) {
    let feature = null;
    this.markerLayer.getSource().getFeatures().forEach(function (f) {
      const props = f.getProperties();
      if (feature === null && props.name && props.name.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
        feature = f;
      }
    });
    if (feature) {
      this.map.getView().fit(feature.getGeometry(), this.map.getSize());
    }
  }
}
