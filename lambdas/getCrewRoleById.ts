import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Movie, MovieCrewRole } from "../shared/types";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import Ajv from "ajv";
import schema from "../shared/types.schema.json";

type ResponseBody = {
  data: {
    movie: Movie;
    cast?: MovieCrewRole[];
  };
};
// Enable coercion so that the string 'true' is coerced to
// boolean true before validation is performed.
const ajv = new Ajv({ coerceTypes: true });
const isValidQueryParams = ajv.compile(
  schema.definitions["MovieCrewRole"] || {}
);
const ddbDocClient = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    // Print Event
    console.log("Event: ", JSON.stringify(event));
    const parameters = event?.pathParameters;
    const queryParams = event?.queryStringParameters || {};

    if (!queryParams) {
      return buildErrorResponse(500, "Missing query parameters");
    }
    if (!isValidQueryParams(queryParams)) {
      return buildErrorResponse(
        500,
        "Incorrect type. Must match Query parameters schema",
        schema.definitions["MovieReviewQueryParams"]
      );
    }

    const crew = parameters?.crew
      ? parseInt(parameters.crew)
      : undefined;
      const movieId = queryParams?.movieId
      ? parseInt(queryParams.movieId)
      : undefined;  


    if (!movieId) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Missing movie Id" }),
      };
    }

    let commandInput: QueryCommandInput = {
      TableName: process.env.TABLE_NAME || "",
    };
    if ("movieId" in queryParams) {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m and crew > :c",
        ExpressionAttributeValues: {
          ":m": movieId,
          ":c": crew,
        },
      };
    } else {
      commandInput = {
        ...commandInput,
        KeyConditionExpression: "movieId = :m",
        ExpressionAttributeValues: {
          ":m": movieId,
        },
      };
    }

    const commandOutput = await ddbDocClient.send(new QueryCommand(commandInput));

    const getCommandOutput = await ddbDocClient.send(
      new GetCommand({
        TableName: process.env.MOVIES_TABLE_NAME,
        Key: { movieId: movieId },
      })
    );
    if (!getCommandOutput.Item) {
      return {
        statusCode: 404,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ Message: "Invalid movie Id" }),
      };
    }
    const body: ResponseBody = {
      data: { movie: getCommandOutput.Item as Movie },
    };
    //const queryParams = event.queryStringParameters;
    if (isValidQueryParams(queryParams)) {
      let queryCommandInput: QueryCommandInput = {
        TableName: process.env.CREW_TABLE_NAME,
      };
      queryCommandInput = {
        ...queryCommandInput,
        KeyConditionExpression: "movieId = :m", 
        ExpressionAttributeValues: {
          ":m": movieId,
        },
      };
      const queryCommandOutput = await ddbDocClient.send(
        new QueryCommand(queryCommandInput)
      );
      body.data.cast = queryCommandOutput.Items as MovieCrewRole[];
    }

    // Return Response
    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    };
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}

function buildSuccessResponse(statusCode: number, data: any) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Origin": "*",
      "content-type": "application/json",
    },
    body: JSON.stringify({ data }),
  };
}

function buildErrorResponse(statusCode: number, message: string, schema?: any) {
  const body = schema ? { message, schema } : { message };
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Headers":
        "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Origin": "*",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  };
}