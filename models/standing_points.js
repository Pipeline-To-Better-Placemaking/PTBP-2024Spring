const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const ObjectId = mongoose.Schema.Types.ObjectId
const points_schema = mongoose.Schema({
    latitude:{
        type: Number,      
        required: true
    },

    longitude:{
        type: Number,
        required: true
    },
    refCount:{
        type:Number,
        required:true,
        default:1
    },
    
    title: String
})

const Standing_Points = module.exports = mongoose.model('Standing_Points', points_schema)

module.exports.updatePoint = async function (pointId, newPoint) {
    return await Standing_Points.updateOne(
        { _id: pointId },
        { $set: {
            title: newPoint.title,
            longitude: newPoint.longitude,
            latitude: newPoint.latitude
        }}
    )
}

module.exports.removeRefrence = async function(pointId) {
    point = await Standing_Points.findById(pointId)
    console.log('point during remove ref: ' + point)
    console.log('before decrease: ' + point.refCount)
    const newRef = point.refCount - 1
    console.log('after decrease: ' + newRef)
    if(newRef <= 0){
        return await Standing_Points.findByIdAndDelete(pointId)

    }
    else{
        return await Standing_Points.updateOne({ _id: pointId }, { refCount: newRef });
    }
}

module.exports.addRefrence = async function(pointId) {
    point = await Standing_Points.findById(pointId)
    console.log('before increase: ' + point.refCount)
    const newRef = point.refCount + 1
    console.log('after increase: ' + newRef)
    return await Standing_Points.updateOne({ _id: pointId }, { refCount: newRef });
}