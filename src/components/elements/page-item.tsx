import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { Grid, Row, Col } from 'react-bootstrap';

import PagesList from './pages-list';
import PageItemToolbar from './page-item-toolbar'

import PageEditor from './page-editor'

import { DragSource } from 'react-dnd';

import { QuickLevelMove, ItemTypes } from '../constants';

import { DropStuffArea } from './drop-stuff-area';

import { TitleEdit } from '../misc/title-edit'
import { TitleDisplay } from '../misc/title-display'

import SyntheticEvent = __React.SyntheticEvent;


const pageListingSource = {
    endDrag(props, monitor, component) {
        let offset = monitor.getDifferenceFromInitialOffset()

        if ( offset == null ) return;

        component.handleEndDrag( { deltaX: offset.x, deltaY: offset.y } )
    },
    beginDrag(props) {
        return {
            localId: props.info.get('localId'),
            id: props.info.get('id'),
            pageOrder: props.info.get('pageOrder')
        };
    }
};

function collect(connect, monitor) {
    return {
        connectDragSource: connect.dragSource(),
        isDragging: monitor.isDragging()
    }
}


/**
 * Represents a page item in product content hierarchy
 *
 * Each page has a DropStuffArea where it's possible do add/assign
 * new contents to the page. Those contents could be pages, tasks,
 * notes and so on
 *
 */
interface PageItemProps {
    connectDragSource: any,
    isDragging: any,
    onTitleChange: any,
    onNewPage?: any,
    onMovePage?:any,
    onChangeTreeState: any,
    onQuickLevelMove: any,
    onChangePageInfo: any,
    onDeletePage: any,
    info: any,
    parentPage: any,
    previousPage: any,
    pageOrder?: number,
    depth?: number
}

interface PageItemState {
    editingTitle?: boolean,
    collapsed?: boolean,
    toolbarVisible?: boolean,
    showPageBodyEditor?: boolean
}


class PageItem extends React.Component<PageItemProps, PageItemState> {
    public static defaultProps: PageItemProps = {
        connectDragSource: null,
        isDragging: false,
        onTitleChange: null,
        onNewPage: null,
        onMovePage: null,
        onChangeTreeState: null,
        onQuickLevelMove: null,
        onChangePageInfo: null,
        onDeletePage: null,
        info: {},
        parentPage: null,
        previousPage: null,
        depth: 0
    }

    constructor(props) {
        super(props);

        this.state = {
            editingTitle: false,
            toolbarVisible: false,
            showPageBodyEditor: false
        }
    }
    toggleEditingTitle() {
        let currentStateEditing = this.state.editingTitle;
        let newStateEditing = !currentStateEditing

        if ( newStateEditing ) {
        }

        this.setState({editingTitle: newStateEditing})
    }
    updateTitle(e) {
        const { info, onTitleChange } = this.props;
        onTitleChange(info.get('localId'), e.target.value )

        this.toggleEditingTitle()
    }

    /**
     * Handles a content drop in DropStuffArea
     * @param itemType
     * @param item
     */
    handleDropItem(itemType, info) {
        const { onNewPage, onMovePage } = this.props

        switch (itemType) {
            case ItemTypes.NEW_PAGE:
                onNewPage(info.ownerPage.get('localId'), info.pageOrder + 1 )
                break
            case ItemTypes.MOVE_PAGE:
                onMovePage( info.sourceLocalId, info.destinationPageLocalId, info.position )
                break
        }
    }
    handleExpandCollapse(e) {
        const { onChangeTreeState, info } = this.props

        const newCollapsedState = !this.state.collapsed
        
        onChangeTreeState( info.get('localId'), {collapsed: newCollapsedState})        
        
        this.setState({collapsed: newCollapsedState })
    }
    handleEndDrag(dragInfo) {
        const { info, pageOrder, onQuickLevelMove } = this.props

        let quickLevelMoveInfo = this.getQuickLevelMoveInfo(dragInfo.deltaX, dragInfo.deltaY)

        // Is it a quick level move?
        if ( quickLevelMoveInfo.direction != QuickLevelMove.DIRECTION_NONE ) {
            onQuickLevelMove( quickLevelMoveInfo.direction, info.get('localId') )
        }
    }

    /**
     * Detect and calculate Quick Level Move (QLM) parameters
     * @param deltaX
     * @param deltaY
     * @returns {{direction: string}}
     */
    getQuickLevelMoveInfo(deltaX, deltaY ) {
        let direction = QuickLevelMove.DIRECTION_NONE
        
        let absDeltaX = Math.abs(deltaX)
        let absDeltaY = Math.abs(deltaY)

        // decides if it's a Q.L.M. 
        if ( (absDeltaX > QuickLevelMove.MIN_DELTA_X) && ( absDeltaY < QuickLevelMove.MAX_DELTA_Y ) ) {
            direction = deltaX > 0 ? QuickLevelMove.DIRECTION_DOWN : QuickLevelMove.DIRECTION_UP
        }
        
        return {
            direction
        }   
    }


    handleMouseEnter(e:SyntheticEvent) {
        this.setState({toolbarVisible: true})

        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
    }

    handleMouseLeave(e:SyntheticEvent) {
        this.setState({toolbarVisible: false})

        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
    }

    handleShowBodyEditor(e:SyntheticEvent) {
        const { info } = this.props

        this.setState({showPageBodyEditor: true})

        // ---> render page editor, if it's necessary
        let pageBodyEditor = <PageEditor
                                    pageInfo={info}
                                    onClose={ this.handleCloseBodyEditor.bind(this) }
                                    onSave={ this.handleSavePage.bind(this) }
                                />

        ReactDOM.render(pageBodyEditor, document.getElementById('product-editor-modal') )
    }

    handleSavePage(pageLocalId, info) {
        const { onChangePageInfo } = this.props

        onChangePageInfo(pageLocalId, info )
        this.closeBodyEditor()
    }

    handleCloseBodyEditor(e:SyntheticEvent) {
        this.closeBodyEditor()
    }

    closeBodyEditor() {
        document.getElementById('product-editor-modal').innerHTML = ''
    }
    
    render() {
        const { info, connectDragSource, isDragging, onTitleChange,
                 onNewPage, onMovePage, parentPage, previousPage,
                pageOrder, onChangeTreeState, onQuickLevelMove,
                onChangePageInfo, onDeletePage,
                depth
        } = this.props;

        let { toolbarVisible } = this.state

        // does this node have children nodes?
        let children = null
        let toolbar = null
        let pages:any = info.get('pages');

        let hasChildren:boolean = (pages != null)

        const collapsed = info.get('collapsed') || false

        // If this page has children and its node is not
        // collapsed, render its children components
        //
        if ( (!collapsed) && (hasChildren) ) {
            children = <PagesList pages={pages}
                                  onTitleChange={onTitleChange}
                                  onNewPage={onNewPage}
                                  onMovePage={onMovePage}
                                  parentPage={info}
                                  onChangeTreeState={onChangeTreeState}
                                  onQuickLevelMove={onQuickLevelMove}
                                  onChangePageInfo={onChangePageInfo}
                                  onDeletePage={onDeletePage}
                                  depth={ depth + 1 }
                        />;
        }

        // is toolbar visible?
        if ( toolbarVisible ) {
            toolbar = <PageItemToolbar
                                pageInfo={ info }
                                onDelete={ onDeletePage }
                                onEditClicked={ this.handleShowBodyEditor.bind(this) }
                        />
        }

        let depthLeftMargin = depth * 5 + '%'


        return connectDragSource(
            <div className="page-item-holder"
                style={{ opacity: isDragging ? 0.5 : 1 }}
            >


                <Row className="page-item"
                        style={{marginLeft: depthLeftMargin}}
                         onMouseEnter={ this.handleMouseEnter.bind(this) }
                         onMouseLeave={ this.handleMouseLeave.bind(this) }
                >
                  <Col md={1} onClick={this.handleExpandCollapse.bind(this)} style={{width: "2em", textAlign: "center"}}>
                      {  hasChildren ? (
                              collapsed ?
                              '+' :
                              '-'
                          ) : <span style={{opacity:0}}>*</span>
                      }
                  </Col>
                  <Col md={8}>
                      <div className="page-title" onClick={ (e) => { this.toggleEditingTitle() } }>
                         { this.state.editingTitle ?
                              <TitleEdit value={ info.get('title') }
                                         onTitleChange={ this.updateTitle.bind(this) }
                              />
                              :
                              <TitleDisplay value={ info.get('title') } />
                          }
                      </div>
                  </Col>
                  <Col md={3}>
                      { toolbar }
                  </Col>
                </Row>

                <DropStuffArea
                    ownerPage={ info }
                    parentPage={ parentPage }
                    previousPage={ previousPage }
                    onDrop={this.handleDropItem.bind(this)}
                    pageOrder={pageOrder}
                />
                {children}
            </div>
        );
    }

}
export default DragSource(ItemTypes.MOVE_PAGE, pageListingSource, collect)(PageItem);









