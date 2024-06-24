## Instructions to student.

This repository contains the starting code for a lab-based exam on the serverless architecture on the AWS platform. You are required to take the following steps in preparation for this exam:

+ Clone this repository.
+ Import the project into VS Code and run the following commands:
~~~bash
$ npm install
$ npm run schema
~~~
+ Create a new repository in your GitHub account called 'serverlessExam'.
+ In VS Code, type the following commands:
~~~bash
$ git remote remove origin
$ git remote add origin ...URL of your new repository...
~~~
+ Immediately before the exam, deploy the app to your AWS account (cdk deploy).

## The App.

The app you have deployed is the REST web API you developed in the labs. However, two new DynamoDB tables are included:

1. Movie Awards - Stores information about awards won by a movie, e.g. Oscars, Golden Globe, etc
1. Movie Crew - Stores data about the crew associated with a movie, e.g. director, cameras, producer, etc

Examine these two tables in the DynamoDB management console. In VS Code, examine all aspects of the code that created these tables, e.g. seeding, types, etc.. __Do not change the code.__

When you have fully understood the app's new features, destroy the stack.

Finally, the day before the exam, redeploy the app again and leave it deployed. 
