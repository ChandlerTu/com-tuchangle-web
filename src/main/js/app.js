'use strict';

const client = require( './client' );
const follow = require( './follow' );
const intl = require( 'react-intl-universal' );
const locales = {
    "en-US": require( './locales/en-US.js' ),
    "zh-CN": require( './locales/zh-CN.js' ),
};
const React = require( 'react' );
const ReactDOM = require( 'react-dom' );
const root = '/api';
const when = require( 'when' );

class CreateDialog extends React.Component {

    constructor( props ) {
        super( props );
        this.handleSubmit = this.handleSubmit.bind( this );
    }

    handleSubmit( e ) {
        e.preventDefault();

        var newDietary = {};
        this.props.attributes.forEach( attribute => {
            newDietary[attribute] = ReactDOM.findDOMNode( this.refs[attribute] ).value.trim();
        } );
        this.props.onCreate( newDietary );

        // clear out the dialog's inputs
        this.props.attributes.forEach( attribute => {
            ReactDOM.findDOMNode( this.refs[attribute] ).value = '';
        } );

        // Navigate away from the dialog to hide it.
        window.location = "#";
    }

    render() {
        return (
            <div>
                <a href="#createDietary">Create</a>

                <div id="createDietary" className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Create new dietary</h2>

                        <form>
                            <p key="food">
                                <input type="text" placeholder={intl.get( 'food' )} ref="food" className="field" />
                            </p>
                            <p key="gram">
                                <input type="text" placeholder={intl.get( 'gram' )} ref="gram" className="field" />
                            </p>
                            <p key="insertTime">
                                <input type="text" placeholder={intl.get( 'insertTime' )} ref="insertTime" className="field" />
                            </p>
                            <button onClick={this.handleSubmit}>{intl.get( 'create' )}</button>
                        </form>
                    </div>
                </div>
            </div>
        )
    }

}

class UpdateDialog extends React.Component {

    constructor( props ) {
        super( props );
        this.handleSubmit = this.handleSubmit.bind( this );
    }

    handleSubmit( e ) {
        e.preventDefault();

        var updatedDietary = {};
        this.props.attributes.forEach( attribute => {
            updatedDietary[attribute] = ReactDOM.findDOMNode( this.refs[attribute] ).value.trim();
        } );
        this.props.onUpdate( this.props.dietary, updatedDietary );

        window.location = "#";
    }

    render() {
        var inputs = this.props.attributes.map( attribute =>
            <p key={this.props.dietary.entity[attribute]}>
                <input type="text" placeholder={attribute}
                    defaultValue={this.props.dietary.entity[attribute]}
                    ref={attribute} className="field" />
            </p>
        );

        var dialogId = "updateDietary-" + this.props.dietary.entity._links.self.href;

        return (
            <div>
                <a href={"#" + dialogId}>Update</a>

                <div id={dialogId} className="modalDialog">
                    <div>
                        <a href="#" title="Close" className="close">X</a>

                        <h2>Update an dietary</h2>

                        <form>
                            {inputs}
                            <button onClick={this.handleSubmit}>Update</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

}

class Dietary extends React.Component {

    constructor( props ) {
        super( props );
        this.handleDelete = this.handleDelete.bind( this );
    }

    handleDelete() {
        this.props.onDelete( this.props.dietary );
    }

    render() {
        return (
            <tr>
                <td>{this.props.dietary.entity.food}</td>
                <td>{this.props.dietary.entity.gram}</td>
                <td>
                    <UpdateDialog dietary={this.props.dietary}
                        attributes={this.props.attributes}
                        onUpdate={this.props.onUpdate} />
                </td>
                <td>
                    <button onClick={this.handleDelete}>Delete</button>
                </td>
            </tr>
        );
    }

}

class DietaryList extends React.Component {

    render() {
        var dietaries = this.props.dietaries.map( dietary =>
            <Dietary key={dietary.entity._links.self.href} dietary={dietary} attributes={this.props.attributes}
                onUpdate={this.props.onUpdate} onDelete={this.props.onDelete} />
        );

        return (
            <table>
                <tbody>
                    <tr>
                        <th>Food</th>
                        <th>Gram</th>
                        <th>Update</th>
                        <th>Delete</th>
                    </tr>
                    {dietaries}
                </tbody>
            </table>
        );
    }

}

class App extends React.Component {

    constructor( props ) {
        super( props );
        this.state = { dietaries: [], attributes: [], initDone: false };
        this.onCreate = this.onCreate.bind( this );
        this.onUpdate = this.onUpdate.bind( this );
        this.onDelete = this.onDelete.bind( this );
    }

    loadLocales() {
        // init method will load CLDR locale data according to currentLocale
        // react-intl-universal is singleton, so you should init it only once in
        // your app
        intl.init( {
            currentLocale: 'zh-CN', // TODO: determine locale here
            locales,
        } )
            .then(() => {
                // After loading CLDR locale data, start to render
                this.setState( { initDone: true } );
            } );
    }

    componentDidMount() {
        this.loadLocales();
        this.loadFromServer();
    }

    loadFromServer() {
        follow( client, root, ['dietaries'] ).then( dietaryCollection => {
            return client( {
                method: 'GET',
                path: dietaryCollection.entity._links.profile.href,
                headers: { 'Accept': 'application/schema+json' }
            } ).then( schema => {
                this.schema = schema.entity;
                return dietaryCollection;
            } );
        } ).then( dietaryCollection => {
            return dietaryCollection.entity._embedded.dietaries.map( dietary =>
                client( {
                    method: 'GET',
                    path: dietary._links.self.href
                } )
            );
        } ).then( dietaryPromises => {
            return when.all( dietaryPromises );
        } ).done( dietaries => {
            this.setState( {
                dietaries: dietaries,
                attributes: Object.keys( this.schema.properties ),
            } );
        } );
    }

    onCreate( newDietary ) {
        follow( client, root, ['dietaries'] ).then( dietaryCollection => {
            return client( {
                method: 'POST',
                path: dietaryCollection.entity._links.self.href,
                entity: newDietary,
                headers: { 'Content-Type': 'application/json' }
            } )
        } ).done( response => {
            this.loadFromServer();
        } );
    }

    onUpdate( dietary, updatedDietary ) {
        client( {
            method: 'PUT',
            path: dietary.entity._links.self.href,
            entity: updatedDietary,
            headers: {
                'Content-Type': 'application/json'
            }
        } ).done( response => {
            this.loadFromServer();
        } );
    }

    onDelete( dietary ) {
        client( {
            method: 'DELETE',
            path: dietary.entity._links.self.href
        } ).done( response => {
            this.loadFromServer();
        } );
    }

    render() {
        return (
            this.state.initDone &&
            <div>
                <CreateDialog onCreate={this.onCreate} attributes={this.state.attributes} />
                <DietaryList dietaries={this.state.dietaries} onUpdate={this.onUpdate}
                    attributes={this.state.attributes} onDelete={this.onDelete} />
            </div>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById( 'react' )
);
