import { connect } from 'react-redux'

import Pages from '../components/elements/pages-list'
import {changePageTitle, newPage, movePage, changeTreeState,
        quickLevelMove, changePageInfo, deletePage } from "../actions/pages"




const mapStateToProps = (state:any) => {
    return {
        pages: state.get('editing').get('pages')
    }
}

const mapDispatchToProps = (dispatch:any) => {
    return {
        onTitleChange: (id:string,newTitle:string) => {
            dispatch( changePageTitle(id, newTitle) );
        },
        onNewPage: (ownerPageLocalId:string, position:number) => {
            dispatch( newPage(ownerPageLocalId,  position) )
        },
        onMovePage: (sourcePageLocalId:string, destinationPageLocalId:string, position:number) => {
            dispatch( movePage(sourcePageLocalId, destinationPageLocalId, position) )
        },
        onChangeTreeState: (pageLocalId:string, newStateInfo:any ) => {
            dispatch( changeTreeState(pageLocalId, newStateInfo) )
        },
        onQuickLevelMove: (direction:string, localPageId:string ) => {
            dispatch( quickLevelMove(direction,localPageId) )
        },
        onChangePageInfo: ( localPageId:string, pageInfo:any ) => {
            dispatch( changePageInfo(localPageId, pageInfo) )
        },
        onDeletePage: (localPageId:string ) => {
            dispatch( deletePage(localPageId) )
        },
    }
}

const mergeProps = (stateProps:any, dispatchProps:any, ownProps:any) => {
    let ret:any = {}

    for( let k in ownProps ) {
        ret[k] = ownProps[k]
    }

    for( let k in stateProps ) {
        ret[k] = stateProps[k]
    }

    for( let k in dispatchProps ) {
        ret[k] = dispatchProps[k]
    }

    return  ret
}

export const PagesList = connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps
)(Pages)

export default PagesList;
