import {Platform, StyleSheet} from 'react-native';

export const styles = StyleSheet.create({

    header: {
        backgroundColor: '#006FD6',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: '10%'
    },

    headerText: {
        textAlign: 'center',
        color: '#FFFFFF',
        marginBottom: 5,
    },

    leftContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-start'
    },

    rightContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },

    button: {
        marginLeft: 25,
        backgroundColor: '#006FD6',
        borderColor: '#006FD6',
      },

});

export default styles;
