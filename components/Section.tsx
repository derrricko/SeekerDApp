import React, {ReactNode} from 'react';
import {StyleSheet, Text, View} from 'react-native';

export const Section: React.FC<{
  children?: ReactNode;
  description?: string;
  title?: string;
}> = ({children, description, title}) => {
  return (
    <View style={styles.sectionContainer}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {description ? (
        <Text style={styles.sectionDescription}>{description}</Text>
      ) : null}
      <View style={styles.childrenContainer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#000000',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  childrenContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 18,
    fontWeight: '900',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  sectionDescription: {
    marginTop: 8,
    fontFamily: 'CourierPrime-Regular',
    fontSize: 14,
    fontWeight: '400',
    color: '#4A4A4A',
    lineHeight: 22,
  },
});
