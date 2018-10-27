import React, { Component } from 'react';
import { View, Animated, PanResponder, Dimensions, Text, LayoutAnimation, UIManager } from 'react-native';
import { Card, Button } from 'react-native-elements';


const SCREEN_WIDTH = Dimensions.get("window").width;
const SWIPE_TRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component{

    static defaultProps = { // If the user not passes the props use the default ones
        onSwipeRight: () => {},
        onSwipeLeft: () => {}
    }

    constructor(props){
        super(props);

        const position = new Animated.ValueXY();

        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true, // This pan responser will execute when user first interact 
            onPanResponderMove: (event, gesture) => { // place debugger to investigate gesture values in console
                //console.log(gesture);
                position.setValue({ x: gesture.dx, y: gesture.dy })
            }, // Fires when user start moving
            onPanResponderRelease: (event, gesture) => {
                if(gesture.dx > SWIPE_TRESHOLD){
                    this.forceSwipe('right');
                }else if(gesture.dx < -SWIPE_TRESHOLD){
                    this.forceSwipe('left');
                }else{
                    this.resetPosition();
                }
                
            } // Fires when user releases moving
        });

        this.state = {
            panResponder,
            position,
            index: 0,
            
        }
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.data !== this.props.data){
            this.setState({ index: 0 })
        }
    }

    componentWillUpdate() {
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true); // Check function exists before call (for android)
        LayoutAnimation.spring();
    }

    forceSwipe(direction){
       
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        
        Animated.timing(this.state.position, {
            toValue: { x, y:0},
            duration: SWIPE_OUT_DURATION
        }).start( () => this.onSwipeComplete(direction) );
    }

    onSwipeComplete(direction){
        const { onSwipeLeft, onSwipeRight, data} = this.props;
        const item = data[this.state.index];

        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);

        this.state.position.setValue({ x: 0, y: 0 }); // Animated component mutates state automatically without using setState()
        this.setState({ index: this.state.index + 1 }); // Get the next card 
    }
  

    resetPosition(){
        Animated.spring(this.state.position, {
            toValue: { x: 0, y: 0}
        }).start();
    }

    getCardStyle(){

        const  { position } = this.state;

        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5], 
            outputRange: ['-120deg', '0deg', '120deg']
        });
        
        return {
            ...position.getLayout(),
            transform: [{ rotate }]
        }
    }

    renderCards(){

        if(this.state.index >= this.props.data.length){
            return this.renderNoMoreCards();
        }

        return this.props.data.map( (item, i) => {

            if(i < this.state.index) { return null }

            if(i === this.state.index){ // Animate only the next index
                return (
                    <Animated.View 
                        key={item.id}
                        style={[this.getCardStyle(), styles.cardStyle]} 
                        {...this.state.panResponder.panHandlers}>
                        {this.props.renderCard(item)}
                    </Animated.View>
                );
            }

            return (
                <Animated.View 
                    key={item.id} 
                    style={[styles.cardStyle, { top: 10 * (i - this.state.index) }]}>
                    {this.props.renderCard(item)}
                </Animated.View>
            )
        }).reverse();
    }


    renderNoMoreCards() {
        return (
            <Card title="All done !">
                <Text style={{marignBottom: 10}}>There is no more cards</Text>
                <Button title="Get more!" backgroundColor="#3A9F4"/>
            </Card>
        )
    }

    render(){
        return (
            <View>
                {this.renderCards()}
            </View>
        );
    }
}


const styles = {
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH
    }
}

export default Deck;