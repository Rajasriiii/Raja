import React, {useState,useEffect,createRef} from 'react';
import {View,Text,StatusBar,TextInput,StyleSheet,ActivityIndicator,Image,Linking,TouchableOpacity,Platform} from 'react-native';
import ActionSheet from "react-native-actions-sheet";
import Ionicons from 'react-native-vector-icons/Ionicons';
import Post from '../Components/Post';
import { Overlay } from 'react-native-elements';
import PopUp from '../Components/PopUp';
import {authentication} from '../Firebase/firebase';

const Home = ({navigation, route})=>{
    // top bar state, if the device is an ios device bring dow the top bar by 20
    const [isIos,setisIos] = useState(0);

    //feed states
    const actionSheetRef = createRef();
    const [Feed,setFeed] = useState([]);
    const [SelectedPostLink,setSelectedPostLink] = useState('');
    const [Refreshing,setRefreshing] = useState(false);
    const [morePostsAvailable,setMorePostsAvailable] = useState(true);

    // search states
    const [searchValue, setSearchValue] = useState('');
    const [closeSearch,setCloseSearch] = useState(true);

    // feed and search state
    const [overlay,setOverlay] = useState(false);
    const [errText,setErrText] = useState('');

    // get the feed
    const getFeed = (reset_feed)=>{
        // set the feed count
        var feed_count = 0;
        reset_feed == true? feed_count = 0: feed_count = Feed.length;

        //set the api call
        var api_call = `https://7ba898feaab5.ngrok.io/feed?feed_count=${feed_count}`;
        if(searchValue.length > 0 && searchValue != ""){
            api_call = `https://7ba898feaab5.ngrok.io/feed?feed_count=${feed_count}&search_term=${searchValue}`;
        }

        fetch(api_call)
        .then(res=>res.json())
        .then(json=>{
            // check if there are any results in the response
            {json.response.length > 0? setMorePostsAvailable(true): setMorePostsAvailable(false)};
            {reset_feed == true? setFeed(json.response): setFeed([...Feed,...json.response])}
            //hide swipe down to refresh
            setRefreshing(false);

            //check if there are any search results and if the feed is empty
            checkResults(json.response.length);

        }).finally(()=>{
            // console.log("results ",Feed);
        }).catch(()=>{
            setErrText("Network error. \n Unable to retrieve results");
            setOverlay(true);
        });
    }

    const checkResults = (resultsLength)=>{
        if(resultsLength == 0 && Feed.length == 0){
            setErrText("No results found");
            setOverlay(true);
        }
    }

    // when you swipe down to refresh on the feed
    const onRefresh = ()=>{
        setRefreshing(true);
        getFeed(true);
    }

    // see the available options when you click on the elipses icon on the top far right of a post
    const viewPostOptions = (feed_index) =>{
        setSelectedPostLink(Feed[feed_index].instagram_link);
        actionSheetRef.current?.setModalVisible();
    }

    //open a link to i.e instagram when you select options on a post and then 'visit artist on instagram'
    const openLink = ()=>{
        Linking.openURL(SelectedPostLink);
    }

    //get more posts when you reach the end of the feed
    const getMorePosts = ()=>{
        getFeed(false);
    }

    const Search = ()=>{
        // search only if there is a search term
        if(searchValue.length > 0){
            setFeed([]);
            setCloseSearch(false);
        }
    }

    const EndSearch = ()=>{
        setSearchValue('');
        setFeed([]);
        setCloseSearch(true);
    }

    const closeOverlay = ()=>{
        setOverlay(false);
        EndSearch();
    }

    const PlayVicdeo = (index)=>{
        var playlist = Feed.slice(index+1,index+6);
        navigation.navigate('Player',{data:Feed[index], playlist:playlist});
    }

    useEffect(()=>{
        // check if device is an ios device
        Platform.OS == 'ios' ? setisIos(20):setisIos(0);

        // check if user is signed in
        authentication.onAuthStateChanged((user)=>{
            if(user){
                // get the colors feed
                getFeed(true);            
            }
            else{
                route.params.authenticate(false);
            }
        });
    },[closeSearch])

    return (
        <>
            <View style={{flex:1,alignItems:'center'}}>
                <StatusBar  backgroundColor="white" barStyle="dark-content"/>
                <View style={{width:'90%',alignItems:'flex-start',alignContent:'flex-start',marginTop:isIos}}>
                    <Image style={{width:150,height:80,resizeMode:'contain'}} source={require('../Images/transparentLogo.png')}/>
                    <View style={{width:'100%',flexDirection:'row',justifyContent:'center'}}>  
                        <TextInput value={searchValue} onChangeText={text => setSearchValue(text)} placeholderTextColor={'#000'} style={styles.searchBar}  placeholder={'Search using artist name or song title'}/>
                        <TouchableOpacity onPress={()=>Search()} style={{width:20,height:20,marginTop:20,position:'absolute',right:10,zIndex:1000}}>
                            <Ionicons color="#989898" size={20} name="ios-search"/>
                        </TouchableOpacity>
                        {closeSearch == false?
                            (
                                <TouchableOpacity onPress={()=>EndSearch()} style={{width:20,height:20,marginTop:20,position:'absolute',right:40,zIndex:1000}}>
                                    <Ionicons color="#989898" size={20} name="close"/>
                                </TouchableOpacity>
                            ):
                            null
                        }
                    </View>
                </View>

 
                <View style={{width:'90%',marginTop:20,paddingBottom:130}}>
                    {Feed.length < 1?
                        (
                            <ActivityIndicator style={{marginTop:20}} size="large" color="#2FBBF0" />

                        ):
                        (
                            <Post play={PlayVicdeo} morePostToLoad={morePostsAvailable} feed={Feed} getMore={getMorePosts} Refreshing={Refreshing} onRefresh={onRefresh} viewPostOptions={viewPostOptions}/>
                        )

                    }
                </View>


            </View>
            <ActionSheet gestureEnabled={true} ref={actionSheetRef} containerStyle={{borderTopRightRadius:30,borderTopLeftRadius:30,backgroundColor:'#000'}}>
                <View style={styles.actionSheet}>
                    <Text style={{color:'white',fontWeight:'bold',fontSize:18,marginBottom:40}}>Post options</Text>
                    <View style={{alignItems:'center',paddingBottom:20,justifyContent:'center'}}>
                        <Text style={{color:'white'}}>Share Aurora post link</Text>
                    </View>
                    <View style={{alignItems:'center',paddingBottom:20,justifyContent:'center'}}>
                        <TouchableOpacity onPress={()=>openLink()}>
                            <Text style={{color:'white'}}>View artist on instagram</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{alignItems:'center',paddingBottom:20,justifyContent:'center'}}>
                        <Text style={{color:'white'}}>Report post</Text>
                    </View>
                </View>
            </ActionSheet>

            <Overlay isVisible={overlay}>
                <PopUp errorBtn={()=>closeOverlay()} text={errText} error={true} />
            </Overlay>

        </>
    )
}

export default Home
const styles = StyleSheet.create({
    actionSheet:{
        height:250,
        backgroundColor:'#000',
        borderTopLeftRadius:30,
        borderTopRightRadius:30,
        justifyContent:'center',
        alignItems:'center'
    },
    searchBar:{
        width:'100%',
        height:40,
        backgroundColor:'rgba(0, 0, 0, 0.06)',
        marginTop:10,
        borderRadius:20,
        paddingLeft:15
    }
})
