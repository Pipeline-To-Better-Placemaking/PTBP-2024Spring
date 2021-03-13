const mongoose = require('mongoose')

const Date = mongoose.Schema.Types.Date
const ObjectId = mongoose.Schema.Types.ObjectId

const entrySchema = mongoose.Schema({
    path: [{
        lat: {
            type: Number,
            required: true
        },
        long: {
            type: Number,
            required: true
        }
    }],
    mode: {
        type: String,
        enum: ['running','walking','swimming','activity_on_wheels','handicap_assisted_wheels'],
        required: true
    },
    time: {
        type: Date,
        required: true
    }
})
const moving_schema = mongoose.Schema({
    
    title:String,
    
    project: {
        type: ObjectId,
        required: true
    },
    standingPoints: [{
        type: ObjectId,
        required: true,
        ref: 'Standing_Points'
    }],
    researchers: [{
        type: ObjectId,
        required: true,
        ref: 'Users'
    }],

    maxResearchers:{
        type: Number,
        required: true,
        default: 1
    },

    sharedData:{
        type: ObjectId,
        ref: 'Moving_Collections',
        required: true
    },

    date:{
        type: Date,
        required: true
    },

    data:[entrySchema]   
})


const Maps = module.exports = mongoose.model('Moving_Maps', moving_schema)
const Entry = mongoose.model('Moving_Entry', entrySchema)


module.exports.addMap = async function(newMap) {
    return await newMap.save()
}

module.exports.updateMap = async function (projectId, newMap) {
    return await Maps.updateOne(
        { _id: projectId },
        { $set: {
            title: newMap.title,
            date: newMap.date,
            maxResearchers: newMap.maxResearchers,
            standingPoints: newMap.standingPoints
        }}
    )
}

module.exports.deleteMap = async function(mapId) {
    return await Maps.findByIdAndDelete(mapId)
}

module.exports.projectCleanup = async function(projectId) {
    return await Maps.deleteMany({ project: projectId })
}


module.exports.addEntry = async function(mapId, newEntry) {
    var entry = new Entry({
        time: newEntry.time,
        mode : newEntry.mode,
        path: newEntry.path
    })

    return await Maps.updateOne(
        { _id: mapId },
        { $push: { data: entry}}
    )
}


module.exports.addResearcher = async function(mapId, userId){
    return await Maps.updateOne(
        { _id: mapId },
        { $push: { researchers: userId}}
    )
}

module.exports.removeResearcher = async function(mapId, userId){
    return await Maps.updateOne(
        { _id: mapId },
        { $pull: { researchers: userId}}
    )
}

module.exports.isResearcher = async function(mapId, userId){
    const doc = await Maps.find(
        {
            _id: mapId, 
            researchers: { $elemMatch:  userId }
        }
    )
    if (doc.length === 0) {
        return false
    }
    return true
}
    
module.exports.findData = async function(mapId, entryId){
    const out = (await Maps.find({
        _id: mapId,
        'data._id': entryId 
    },
    {'data.$':1}))

    return out[0].data[0]
}

module.exports.updateData = async function(mapId, dataId, newEntry){
    return await Maps.updateOne(
        {
            _id: mapId,
            'data._id': dataId 
        },
        { $set: { "data.$": newEntry}}
    )}

module.exports.deleteEntry = async function(mapId, entryId) {
    return await Maps.updateOne(
        { _id: mapId },
        { $pull: { data: {_id:entryId }}
        })
}