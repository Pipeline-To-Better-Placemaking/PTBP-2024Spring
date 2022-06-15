import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Text, Button, Icon, Divider, MenuItem } from '@ui-kitten/components';
import { HeaderBack, HeaderBackEdit } from '../../components/headers.component';
import { ViewableArea, ContentContainer, ConfirmDelete } from '../../components/content.component';
import { getDayStr, getTimeStr } from '../../components/timeStrings.component.js';
import { helperGetResult, deleteTimeSlot, getProject, getAllResults, isUserTeamOwner } from '../../components/apiCalls';
import { formatBoundaryGraphData, calcArea } from '../../components/helperFunctions';
import { MyPieChart, MyBarChart } from '../../components/charts.component';

import { styles } from './resultPage.styles';

//quantitative data screen
export function BoundaryResultPage(props) {

  const [refreshing, setRefreshing] = useState(false);
  const [editMenuVisible, setEditMenuVisible] = useState(false);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  // random colors for pie charts
  const colors = ["#63A46C", "#DB504A", "#7692FF", "#FFB7FF", "#8A4FFF"]

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    refreshDetails();
    setRefreshing(false);
  }, []);

  const refreshDetails = async () => {
    if (props.selectedResult !== null && props.selectedResult.sharedData !== undefined) {
      let result = await helperGetResult(
                           props.selectedResult._id,
                           "boundaries_maps/",
                           "boundary",
                           props.selectedResult.sharedData,
                           props.project
                         );
      result = await formatBoundaryGraphData(result);
      await props.setSelectedResult(result);
      await refreshProjectPageDetails();
    }
  };

  // refreshes previous page
  const refreshProjectPageDetails = async () => {
    let proj = await getProject(props.project);
    if (proj !== null) {
      let results = await getAllResults(proj);
      await props.setResults(results);
    }
  };

  const deleteResult = async () => {
    let success = false;
    if (props.selectedResult !== null) {
      success = await deleteTimeSlot("boundaries_maps", props.selectedResult._id);
    }
    if (success) {
      await refreshProjectPageDetails();
      await setConfirmDeleteVisible(false);
      props.navigation.goBack();
    }
  }

  if (props.selectedResult === null ||
      !props.selectedResult.success ||
      props.selectedResult.graph === undefined) {
    return (
      <ViewableArea>
        {isUserTeamOwner(props.team, props.userId)
          ?
          <HeaderBackEdit {...props} text={"No results"} editMenuVisible={editMenuVisible} setEditMenuVisible={setEditMenuVisible}>
            <MenuItem title='Delete Result' onPress={() => {setEditMenuVisible(false); setConfirmDeleteVisible(true)}}/>
          </HeaderBackEdit>
          :
          <HeaderBack {...props} text={"No results"}/>
        }
        <ConfirmDelete
          visible={confirmDeleteVisible}
          setVisible={setConfirmDeleteVisible}
          dataType={"result"}
          deleteFunction={deleteResult}
        />
        <ContentContainer>
          <ScrollView
            style={styles.margins}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
              />
            }
          >

            <Text category={'h5'}>No result information for this activity</Text>

          </ScrollView>
        </ContentContainer>
      </ViewableArea>
    );
  }

  let areaTitle = '';
  let viewMap = true;
  let errorMessage = 'Error: \n';

  // error checking for area
  if (props.selectedResult.sharedData.area === undefined ||
      props.selectedResult.sharedData.area === null ||
      props.selectedResult.sharedData.area.length <= 0
    ) {
      areaTitle = 'unknown';
      viewMap = false;
      errorMessage += '- Area information has been deleted\n';
  } else {
    areaTitle = (props.selectedResult.sharedData.area.title === undefined ? 'Project Perimeter' : props.selectedResult.sharedData.area.title)
  }

  errorMessage += '\n\t Unable to Load Map View';

  let startTime = new Date(props.selectedResult.date);
  let day = new Date(props.selectedResult.sharedData.date);

  let researchers = props.selectedResult.researchers.map(user => {
    return "\n\t" + user.firstname + ' ' + user.lastname;
  });

  const viewMapResults = () => {
    props.navigation.navigate("BoundaryMapResultsView");
  }

  // returns the total distance of all line boundaries
  const totalDistance = (arr) =>{
    let ret = 0;
    // how to access the length of an object
    // console.log(Object.keys(arr).length)
    // go through the entire passed in array and sum all construction values
    for(let i = 0; i < Object.keys(arr).length; i++){
      if(arr[i].type == "Construction") ret += arr[i].value
    }
    // enforce 2nd decimal rounding and return that as a number (float)
    let tempString = ret.toFixed(2);
    ret = parseFloat(tempString);
    return ret;
  }
  const totalLineDistance = totalDistance(props.selectedResult.graph);

  // total project area (in feet squared)
  const totalArea = calcArea(props.selectedResult.sharedData.area.points)

  // searches to see if we already formatted an entry for that description 
  const descSearch = (obj, str) =>{
    // 1st entry into the graph obj
    if(obj[0].value === undefined) return 0;
    // search through the formatted graph object to see if that string is already in it
    for(let i = 0; i < Object.keys(obj).length; i++){
      // if that string already exists, return -1
      if(obj[i].legend === str) return -1;
    }
    return 0;
  }

  // does same as above desc search, but needs a different format for arguments
  const conDescSearch = (arr, str)=>{
    let len = arr.length
    // 1st entry
    if(len === 0) return 0;
    // search through label array to see if that description is already there
    for(let i = 0; i < len; i++){
      // if it is there, return -1
      if(arr[i] === str) return -1;
    }
    return 0;
  }
  
  const formatForTotalPie = (obj) =>{
    //console.log(obj)
    let ret = [{}];
    let sum = 0;
    let currentType = "Material";
    let svg = {fill: "#FFE371"};
    let tempString;

    for(let i = 0; i < 3; i ++){
      // for open horizontal space, value set to 0 for now
      if(i === 0){
        ret[i] = {
          key: i + 1,
          value: 0,
          svg: {fill: "#C4C4C4"},
          legend: "Free Space"
        }
        continue
      }
      
      for(let j = 0; j < Object.keys(obj).length; j++){
        if(obj[j].type === currentType) sum += obj[j].value;
      }

      // enforces decimal rounding to 2nd decimal
      tempString = sum.toFixed(2)
      sum = parseFloat(tempString);
      
      ret[i] = {
        key: i + 1,
        value: sum,
        svg: svg,
        legend: currentType 
      }
      // reset sum and change the variables for the next type of boundary
      sum = 0;
      currentType = "Shelter";
      svg = {fill: "#FFA64D"};
    }
    // now compute the free space value since we have the sums of the other 2 boundary areas
    let areaLeft = totalArea - (ret[1].value + ret[2].value);
    // ensures the decimal is rounded to the 2nd place
    tempString = areaLeft.toFixed(2)
    areaLeft = parseFloat(tempString);
    ret[0].value = areaLeft;

    return ret;
  }

  const formatForIndividual = (obj, type) =>{
    // console.log(obj)
    let ret = [{}];
    let index = 0;
    for(let i = 0; i < Object.keys(obj).length; i++){
      // if the boundary is the type we're formatting
      if(obj[i].type === type){
        let desc = obj[i].description
        // only add the next object if that description is not already in the format object
        if(descSearch(ret, desc) !== -1){
          let sum  = obj[i].value;
          // look for all instances of that boundary description to sum its values together
          for(let j = i + 1; j < Object.keys(obj).length; j ++){
            if(desc === obj[j].description) sum += obj[j].value
          }
          
          // enforces decimal rounding to 2nd decimal
          let tempString = sum.toFixed(2)
          sum = parseFloat(tempString);
          
          ret[index] ={
            key: i + 1,
            value: sum,
            svg: { fill: colors[index] },
            legend: obj[i].description 
          }
          // increase index after adding the boundary
          index++;
        }
      }
    }
    return ret;
  }

  const formatForConstruction = (obj) =>{
    // console.log(obj);
    let ret = {};
    let values = [];
    let labels = [];
    for(let i = 0; i < Object.keys(obj).length; i++){
      if(obj[i].type === "Construction"){
        let desc = obj[i].description        
        // only add the next object if that description is not already in the format object
        if(conDescSearch(labels, desc) !== -1){
          let sum  = obj[i].value;
          // look for all instances of that boundary description to sum its values together
          for(let j = i + 1; j < Object.keys(obj).length; j++){
            if(desc === obj[j].description) sum += obj[j].value
          }
          
          // enforces decimal rounding to 2nd decimal
          let tempString = sum.toFixed(2)
          sum = parseFloat(tempString);
          
          values.push(sum);
          labels.push(desc)
        }
      }
    }
    ret = {
      data: values,
      label: labels
    }
    return ret;
  }

  const chartWidth = Dimensions.get('window').width*0.95;
  const chartHeight = 210;

  const color = '#006FD6';
  
  const conGraph = formatForConstruction(props.selectedResult.graph)

  return (
    <ViewableArea>
      {isUserTeamOwner(props.team, props.userId)
        ?
        <HeaderBackEdit {...props}
          text={props.project.title + ": " + props.selectedResult.sharedData.title}
          editMenuVisible={editMenuVisible}
          setEditMenuVisible={setEditMenuVisible}
        >
          <MenuItem title='Delete Result' onPress={() => {setEditMenuVisible(false); setConfirmDeleteVisible(true)}}/>
        </HeaderBackEdit>
        :
        <HeaderBack {...props} text={props.project.title + ": " + props.selectedResult.sharedData.title}/>
      }
      <ConfirmDelete
        visible={confirmDeleteVisible}
        setVisible={setConfirmDeleteVisible}
        dataType={"result"}
        deleteFunction={deleteResult}
      />
      <ContentContainer>
        <ScrollView
          style={styles.margins}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        >

          <Text category={'h5'}>Spatial Boundaries Results</Text>
          <Divider style={styles.metaDataTitleSep} />

          <Text>Team: {props.team.title}</Text>
          <Text>Admin: {props.team.users[0].firstname} {props.team.users[0].lastname}</Text>

          <Divider style={styles.metaDataSep} />

          <Text>Location: {props.project.description}</Text>
          <Text>Area: {areaTitle}</Text>

          <Divider style={styles.metaDataSep} />

          <Text>Day: {getDayStr(day)}</Text>
          <Text>Start Time: {getTimeStr(startTime)} </Text>
          <Text>Duration: {props.selectedResult.sharedData.duration} min</Text>

          <Divider style={styles.metaDataSep} />

          <Text>Researcher(s): {researchers} </Text>

          <Divider style={styles.metaDataEndSep} />

          {viewMap
            ?
              <View style={styles.mapButton}>
                <Button
                  style={styles.button}
                  status={'info'}
                  appearance={'outline'}
                  accessoryRight={MapIcon}
                  onPress={viewMapResults}
                >
                  View Map
                </Button>
              </View>
            :
              <View style={styles.errorMsgView}>
                <Text status='danger' category='s1' style={styles.errorMsgText}>
                  {errorMessage}
                </Text>
              </View>
          }
          
          <MyPieChart
            title={'Occupied Area'}
            graph={formatForTotalPie(props.selectedResult.graph)}
            height={200}
          />
          
          <View style={styles.spacing}>
          <MyPieChart
            title={'Material Areas'}
            graph={formatForIndividual(props.selectedResult.graph, "Material")}
            height={200}
          />
          </View>

          <View style={styles.spacing}>
            <MyPieChart
              title={'Shelter Areas'}
              graph={formatForIndividual(props.selectedResult.graph, "Shelter")}
              height={200}
            />
          </View>

          <View style={styles.spacing}>
            <MyBarChart
              {...props}
              title={"Construction Distances"}
              rotation={'0deg'}
              dataValues={conGraph.data}
              dataLabels={conGraph.label}
              barColor={color}
              width={chartWidth}
              height={chartHeight}
            />
          </View>
          
        </ScrollView>
      </ContentContainer>
    </ViewableArea>
  );
};

// compass-outline
// pin-outline
const MapIcon = (props) => (
  <Icon {...props} name='compass-outline'/>
);

// file-text-outline
// pie-chart-outline
const ChartIcon = (props) => (
  <Icon {...props} name='file-text-outline'/>
);