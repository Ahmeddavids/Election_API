const express = require( 'express' )
const mongoose = require( 'mongoose')
PORT = 2023;

mongoose.connect("mongodb+srv://ahmeddavids6:MPItZaAClTDXgGUY@cluster0.nu2av5b.mongodb.net/").then(() => {
    console.log("Connection to database is successful");
}).catch( (error) =>{
    console.log(error.message);
})


const electionSchema = mongoose.Schema( {
    state: {
        type: String,
        required: [true, "State is required."]
    },
    parties: [{
        type: String,
        required: [true, "Party is required."]
    }],
    coalationOficcer: {
        type: String
    },
    isRigged: {
        type: Boolean
    },
    totalLg: {
        type: Number
    },
    results: {
        APC: {
            type: Number
        },
        ADC: {
            type: Number
        },
        PDP: {
            type: Number
        },
        LP: {
            type: Number
        },
        
    },
    winner: {
        type: String,
      },
});
const electionModel = mongoose.model( 'election', electionSchema );

const app = express();
app.use( express() );
app.use( express.json() );

app.post("/election", async (req, res) => {
    try {
      const electionResult = await electionModel.create(req.body);
      if (!electionResult) {
        res.status(400).json({
          Error: "Error creating election result.",
        });
      } else {
        const results = electionResult.results;
        let stateWinner = null;
        let stateHighestVote = null;
        for (const party in results) {
          if (results.hasOwnProperty(party)) {
            const voteCount = results[party];
            if (stateHighestVote === null || voteCount > stateHighestVote) {
              stateHighestVote = voteCount;
              stateWinner = party;
            }
          }
        }
        electionResult.winner = stateWinner;
        await electionResult.save();
        res.status(201).json({
          message: `The winner of this election is: ${stateWinner}`,
          data: electionResult
        });
      }
    } catch (error) {
      res.status(400).json({
        Message: error.message,
      });
    }
  });
  

app.get( '/election', async ( req, res ) => {
    try {
        const election = await electionModel.find();
        if ( election.length === 0 ) {
            res.status( 400 ).json( {
                Error: 'This collection has no data.'
            })
        } else {
            res.status(201).json({
                message: `The total number of result showing is: ${election.length}`,
                data: election
            })
        }
    } catch ( error ) {
        res.status( 400 ).json( {
            Message: error.message
        })
    }
})

app.get( '/election/:electionResultId', async ( req, res ) => {
    try {
        const electionResultId = req.params.electionResultId;
        const electionResult = await electionModel.findById(electionResultId);
        if ( !electionResult ) {
            res.status( 400 ).json( {
                Error: `No Election Result with this id: ${electionResultId} found`
            })
        } else {
            res.status(201).json(electionResult)
        }
    } catch ( error ) {
        res.status( 400 ).json( {
            Message: error.message
        })
    }
} )

app.patch("/election/:electionResultId", async (req, res) => {
    try {
      const electionResultId = req.params.electionResultId;
      const electionResult = await electionModel.findById(electionResultId);
      const bodyData = {
        state: req.body.state || electionResult.state,
        parties: req.body.parties || electionResult.parties,
        coalationOficcer:
          req.body.coalationOficcer || electionResult.coalationOficcer,
        isRigged: req.body.isRigged || electionResult.isRigged,
        totalLg: req.body.totalLg || electionResult.totalLg,
        results: {
          APC: req.body.results.APC || electionResult.results.APC,
          ADC: req.body.results.ADC || electionResult.results.ADC,
          PDP: req.body.results.PDP || electionResult.results.PDP,
          LP: req.body.results.LP || electionResult.results.LP,
        },
      };
  
      const results = bodyData.results;
      let stateWinner = null;
      let stateHighestVote = null;
      for (const party in results) {
        if (results.hasOwnProperty(party)) {
          const voteCount = results[party];
          if (stateHighestVote === null || voteCount > stateHighestVote) {
            stateHighestVote = voteCount;
            stateWinner = party;
          }
        }
      }
      bodyData.results[stateWinner] = stateHighestVote;
      bodyData.winner = stateWinner;
  
      await electionModel.updateOne({ _id: electionResultId }, bodyData);
      res.status(200).json(bodyData);
    } catch (error) {
      res.status(400).json({
        Message: error.message,
      });
    }
  });
  

app.delete( '/election/:electionResultId', async function ( req, res ) {
    try {
        const electionResultId = req.params.electionResultId;
        const electionResult = await electionModel.findById( electionResultId );
        if ( electionResult ) {
            const deletedElectionResult = await electionModel.findByIdAndDelete( electionResultId );
            res.status( 200 ).json( {
                Message: `Election Result with this id: ${ electionResultId } has been deleted.`,
                deleted: deletedElectionResult
            })
        } else {
            res.status( 400 ).json( {
                Error: "Error deleting Election Result."
            })
        }
        
    } catch ( error ) {
        res.status( 400 ).json( {
            Message: error.message
        })
    }
})




app.get('/riggedresult', async (req, res) => {
  try {
    const electionResults = await electionModel.find();
    if (electionResults.length === 0) {
      return res.status(404).json({
        Error: 'No election results found.',
      });
    }

    let riggedCount = 0;
    let notRiggedCount = 0;

    for (const electionResult of electionResults) {
      if (electionResult.isRigged) {
        riggedCount++;
      } else {
        notRiggedCount++;
      }
    }

    let overallRiggedResult;

    if (riggedCount > notRiggedCount) {
      overallRiggedResult = 'This Election seems rigged';
    } else if (riggedCount < notRiggedCount) {
      overallRiggedResult = 'This Election is not rigged';
    } else {
      overallRiggedResult = 'This Election is fair';
    }

    res.status(200).json({
      overallRiggedResult,
      riggedCount,
      notRiggedCount,
    });
  } catch (error) {
    res.status(400).json({
      Message: error.message,
    });
  }
});


app.get("/overall", async (req, res) => {
  try {
    const allResults = await electionModel.find();
    if (!allResults || allResults.length === 0) {
      res.status(404).json({
        error: "No election results found.",
      });
    } else {
      let overallResults = {};
      for (const result of allResults) {
        const resultData = result.results;
        for (const party in resultData) {
          if (resultData.hasOwnProperty(party)) {
            const voteCount = resultData[party];
            if (overallResults.hasOwnProperty(party)) {
              overallResults[party] += voteCount;
            } else {
              overallResults[party] = voteCount;
            }
          }
        }
      }

      let overallWinner = null;
      let highestVoteCount = null;
      for (const party in overallResults) {
        if (overallResults.hasOwnProperty(party)) {
          const voteCount = overallResults[party];
          if (highestVoteCount === null || voteCount > highestVoteCount) {
            highestVoteCount = voteCount;
            overallWinner = party;
          }
        }
      }

      res.status(200).json({
        message: `The winner of the 2023 Election is: ${overallWinner}`,
        overallWinner,
        results: overallResults,
      });
    }
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});



app.get('/result/states/:state', async (req, res) => {
  try {
    const state = req.params.state;

    const electionResult = await electionModel.findOne({ state: state });

    if (!electionResult) {
      return res.status(400).json({
        Error: `No election result found for state: ${state}`,
      });
    }

    const winner = electionResult.winner;

    return res.status(200).json({
      message: `This state election was won by ${winner}`,
      state: electionResult.state,
      winner: winner,
    });
  } catch (error) {
    return res.status(400).json({
      Message: error.message,
    });
  }
});







app.listen(PORT, ()=>{
    console.log(`Server is listening to port ${PORT}`)
  })





  
  // app.get('/result/states', async (req, res) => {
  //   try {
  //     const allStates = await electionModel.find();
  //     const state = req.query.state;
  
  //     if (state) {
  //       const selectedState = allStates.find((stateData) =>
  //         stateData.state.toLowerCase() === state.toLowerCase()
  //       );
  
  //       if (!selectedState) {
  //         return res.status(400).json({
  //           Error: `No election result found for state: ${state}`,
  //         });
  //       }
  
  //       const results = selectedState.results;
  //       let stateWinner = null;
  //       let stateHighestVote = null;
  
  //       for (const party in results) {
  //         if (results.hasOwnProperty(party)) {
  //           const voteCount = results[party];
  //           if (stateHighestVote === null || voteCount > stateHighestVote) {
  //             stateHighestVote = voteCount;
  //             stateWinner = party;
  //           }
  //         }
  //       }
  
  //       return res.status(200).json({
  //         state: selectedState.state,
  //         winner: stateWinner,
  //         highestVote: stateHighestVote,
  //       });
  //     } else {
  //       const stateWinners = allStates.map((state) => {
  //         const results = state.results;
  //         let stateWinner = null;
  //         let stateHighestVote = null;
  
  //         for (const party in results) {
  //           if (results.hasOwnProperty(party)) {
  //             const voteCount = results[party];
  //             if (stateHighestVote === null || voteCount > stateHighestVote) {
  //               stateHighestVote = voteCount;
  //               stateWinner = party;
  //             }
  //           }
  //         }
  
  //         return {
  //           state: state.state,
  //           winner: stateWinner,
  //           highestVote: stateHighestVote,
  //         };
  //       });
  
  //       return res.status(200).json(stateWinners);
  //     }
  //   } catch (error) {
  //     return res.status(400).json({
  //       Message: error.message,
  //     });
  //   }
  // });