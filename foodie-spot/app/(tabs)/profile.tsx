import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {

    const pageName = "Profile Screen";

    return (
        <SafeAreaView style={styles.safeAreaViewTextPosition}>
            <Text style={styles.safeAreaViewText}>{pageName}</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 178,
        width: 290,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
    safeAreaViewTextPosition: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    safeAreaViewText: {
        color: 'red',
        fontWeight: 'bold',
    }
});
