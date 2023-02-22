# KuFlow - "Guess the Number Game" with TypeScript example

## What will we create?

This tutorial will guide us in building a simple "*Guess the Number Game*" process using a Temporal.io worker workflow (*when we apply the Workflow as Code paradigm*) and in this case: TypeScript language .

## Prerequisites

Before starting your Workflow for the first time, you must register in [KuFlow (app.kuflow.com)](https://app.kuflow.com/). After familiarizing yourself with the user interface by navigating through the menus or visiting our [Youtube channel](https://www.youtube.com/channel/UCXoRtHICa86YfX8P_wu1f6Q) with many videos that will help you in this task, you are ready to perform the necessary configurations for our Worker. To do so, click on the `Management` menu.

### Create the Credentials

#### Create the credentials for the Worker

We will configure an `APPLICATION` that will provide us with the necessary credentials so that our Worker (written in Java and located in your own machine) can interface with KuFlow.

Go to the `Settings > Applications` menu and click on `Add application`. We establish the name we want and save. Next, you will get the first data needed to configure our Worker.

- **Identifier**: Unique identifier of the application. For this tutorial: *myApp*
  - Later in this tutorial, we will configure it in the `kuflow.api.client-id` property of our example.
- **Token**: Password for the application.
  - Later in this tutorial, we will configure it in the `kuflow.api.client-secret` property of our example.
- **Namespace**: Temporal's namespace.
  - Later in this tutorial, we will configure it in the `application.temporal.namespace` property of our example.

Next, we will proceed to create the certificates that will serve us to configure the Mutual TLS with which our Worker will perform the authentication against Temporal. To do this we click on "Add certificate", set the name we want, and choose the `PKCS8` type for the encryption of the private key. This is important since the example code in this tutorial works with this encoding. We will get the following:

- **Certificate**: It is the public part that is presented in the *mTLS* connection.
  - Later in this tutorial, we will configure it in the `application.temporal.mutual-tls.cert-data` property of our example.
- **Private Key**: It is the private key for *mTLS*.
  - Later in this tutorial, we will configure it in the `application.temporal.mutual-tls.key-data` property of our example.

It is also necessary to indicate the CA certificate, which is the root certificate with which all certificates are issued. It is a public certificate and for convenience you can find it in the same `Application` screen, under the name of *CA Certificate*. This certificate will always be the same between workers.

- **CA Certificate**: Root certificate with which all certificates (client and server certificates) are issued.
  - Later in this tutorial, we will configure it in the `kuflow.activity.kuflow.key-data` property of our example.

Finally, you get something like:

<div class="text--center">

![](/img//TUT-01-App.png)

</div>

## Preparing Scenario

### Create the process definition

We need to create the definition of the process that will execute our workflow. In this section, we will configure the KuFlow tasks of which it is made up as well as the information necessary to complete said tasks, the process access rules (i.e. *RBAC*), as well as another series of information. To do this we go to the `Setting > Processes` menu and create a new process.

Complete *Process Definition* with the (*recommended*) following data:

- **Process name**
    - Number Game
- **Description**
    - Free text description about the Workflow.
- **Workflow**
    - **Workflow Engine**
   	  - *KuFlow Engine*, because we are designing a Temporal-based Worker.
  - **Workflow Application**
  	- myApp, the application to which our Worker will connect to.
  - **Task queue**
    - The name of the Temporal queue where the KuFlow tasks will be set. You can choose any name, later you will set this same name in the appropriate configuration in your Worker. For this tutorial: *NGQueue*.
  - **Type**
    - It must match the name of the Java interface of the Workflow. For this tutorial, *NGWorker* is the name you should type in this input.
- **Permissions**
    - At least one user or group of users must have the role of `INITIATOR` to instantiate the process through the application. In this tutorial, we will allow the *“Default Group”* from this organization.

Finally, you get something like:

<div class="text--center">

![](/img/TUT13-03-Process.png)

</div>

We will define two **Tasks Definitions** in the process as follows:

- Task one **"CPU Message"**
    - **Description:** Free text description about the Task.
    - **Code:** CPUMESSAGE
    - **Candidates:** Default Group (*in this tutorial, we will allow all users from this organization to fill up the application form*)
    - **Elements:**
   	  - **Name:** Message
        - **Description:** Free text description about the element (*optional*).
        - **Code:** MESSAGE
        - **Type:** Field
        - **Properties:** Read Only
        - **Field Type:** Text
- Task two **"User Answer"**
    - **Description:** Free text description about the Task.
    - **Code:** USERANSWER
    - **Candidates:** Default Group (*in this tutorial, we will allow all users from this organization to fill up the application form*)
    - **Elements:**
      - **Name:** Message
        - **Description:** Free text description about the element (*optional*).
        - **Code:** MESSAGE
        - **Type:** Field
        - **Properties:** Read Only
        - **Field Type:** Text
      - **Name:** User Answer
        - **Description:** Free text description about the element (*optional*).
        - **Code**: ANSWER
        - **Type**: Field
        - **Properties**: Mandatory
        - **Field Type:** Number
          - **Validations**: Length Greater or equal than 1
          - **Validations:** Length Less or equal than 10

You'll get something like:

<div class="text--center">

![](/img/TUT13-04-Task_1.png)

![](/img/TUT13-04-Task_2.png)

</div>

### Publish the process and download the template for the Workflow Worker

By clicking on the `Publish` button you’ll receive a confirmation request message, once you have confirmed, the process will be published.

<div class="text--center">

![](/img/TUT13-05-publish_1.png)

![](/img/TUT13-05-publish_2.png)

</div>

Now, you can download a sample Workflow Implementation from the Process Definition main page.

<div class="text--center">

![](/img/TUT13-07-Template_1.png)

![](/img/TUT13-07-Template_2.png)

</div>

This code will serve as a starting point for implementing our worker. As we'll use the TypeScript template, the requirements for its use are the following:

- **TypeScript JDK**
	- You need to have NodeJS installed on your system. The current example code uses version 16+.
- **IDE**
	- An IDE with good TypeScript support is necessary to work comfortably. You can use VSCode, IntelliJ Idea, Eclipse or any other with corresponding TypeScript plugins.

### Main technologies used in the example

To make things simpler, the following technologies have been mainly used in our example:

- **KuFlow TypeScript SDK**
	- Provide some activities to work with KuFlow.
- **Temporal TypeScript SDK**
	- To perform GRPC communications with the KuFlow temporal service.

## Implementation

**Note:** You can download the following project from our [Community Github repository](https://github.com/Hec-KuFlow), be sure to add all the tokens and secrets from your KuFlow account.

### Resolve dependencies

If your IDE does not resolve dependencies automatically, run the following command in a terminal and restart it: **npm i**

### Using Credentials

Now, in this step we are filling up the application configuration information. You must complete all the settings and replace the example values indicated as "FILL_ME".

The appropriate values can be obtained from the KuFlow application. Check out the [Create the Credentials](#create-the-credentials-for-the-worker) section of this tutorial.

```yaml
# ===================================================================
# PLEASE COMPLETE ALL CONFIGURATIONS BEFORE STARTING THE WORKER
# ===================================================================

kuflow:
 api:

   # ID of the APPLICATION configured in KUFLOW.
   # Get it in "Application details" in the Kuflow APP.
   client-id: FILL_ME

   # TOKEN of the APPLICATION configured in KUFLOW.
   # Get it in "Application details" in the Kuflow APP.
   client-secret: FILL_ME

application:
 temporal:

   # Temporal Namespace. Get it in "Application details" in the KUFLOW APP.
   namespace: FILL_ME

   # Temporal Queue. Configure it in the "Process definition" in the KUFLOW APP.
   kuflow-queue: FILL_ME

   mutual-tls:
   # Client certificate
   # Get it in "Application details" in the KUFLOW APP.
   cert-data: |
   	-----BEGIN CERTIFICATE-----
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	…
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	-----END CERTIFICATE-----

   # Private key
   # Get it in "Application details" in the KUFLOW APP.
   # IMPORTANT: This example works with PKCS8, so ensure PKCS8 is selected
   #        	when you generate the certificates in the KUFLOW App
   key-data: |
   	-----BEGIN CERTIFICATE-----
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	…
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	-----END CERTIFICATE-----

   # KUFLOW Certification Authority (CA) of the certificates issued in KUFLOW
   ca-data: |
   	-----BEGIN CERTIFICATE-----
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	…
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_fill_me_
   	-----END CERTIFICATE-----
```

Please note that this is a YAML, respect the indentation. You'll get something like this:

<div class="text--center">

![](/img/TUT-06-Template_3.png)

</div>

### Workflow Implementation

In this section, we will make the fundamental steps to creating the most basic workflow for this business process:

- Users will be prompted to guess a predefined random number. They will have the number of retries needed to resolve it.

Our first step with the code is including the imports needed for this tutorial using some feature of your IDE (*like pressing **SHIFT+ ALT + O** in Visual Studio Code*).

```typescript
import { getElementValueAsNumber, Task } from '@kuflow/kuflow-rest'
import type { createKuFlowAsyncActivities, createKuFlowSyncActivities } from '@kuflow/kuflow-temporal-activity-kuflow'
import { WorkflowRequest, WorkflowResponse } from '@kuflow/kuflow-temporal-activity-kuflow'
import { LoggerSinks, proxyActivities, proxySinks, uuid4 } from '@temporalio/workflow'
```

At the end of our code we add the method to create a random number:

```typescript
function createTheNumber(): number {
  // Generate a random number between 1 and 10
  const randomNumber = Math.floor(Math.random() * 10) + 1;
  return randomNumber
}
```

Now we modify the **workflow.ts** file wich contain our main method *NGWorker(...)* as follows:


1. The first line initializes a constant variable cpuNumber with a randomly generated number using the function we called createTheNumber().
2. A welcome message "messageCPU" is created.
3. We add to the createTaskCPUMessage function the argument "messageCPU". This function is responsible for displaying the messages we define to the user through the KuFlow UI.
	4. A new message, messageUSR, is created, prompting the user to enter a number.
5. A while loop is initiated to continuously prompt the user for an answer until the correct number is guessed. The loop's condition is that the result variable is not equal to true.
6. Within the loop, the getElementValueAsNumber function is responsible for collecting the number entered by the user and adding the previous created message.
7. The IF statement checks whether the userAnswer is equal to the cpuNumber. If it is, a message change to be displayed to the user, indicating that they have guessed the number correctly, and the loop is exited by setting the result to true. Otherwise, the loop continues by displaying a "Try again" message to the user and setting the result to false.
8. The loop continues until the user guesses the correct number, at which point the program ends.

```typescript
...
  const cpuNumber = createTheNumber()
  let messageCPU = "Welcome, I have thought of a number, which you must guess. " + cpuNumber

  await createTaskCPUMessage(workflowRequest, messageCPU)
  
  let messageUSR = "Enter a number"
  let result = false 
  while (result != true){
    let userAnswer = getElementValueAsNumber(await createTaskUserAnswer(workflowRequest, messageUSR), 'ANSWER')
    
    if (userAnswer === cpuNumber) {
      messageCPU = "You guessed it!!"
      await createTaskCPUMessage(workflowRequest, messageCPU)
      result = true;
    } else {
        messageUSR = "Try again"
        result = false;
      }
  }
...
```

## Testing

We can test all that we have done by running the worker (*like typing **npm run start** in the Visual Studio Code terminal*):

<div class="text--center">

![](/img/TUT13-07-Test_1.png)

</div>

And initiating the process in KuFlow’s UI.

<div class="text--center">

![](/img/TUT13-07-Test_2.png)

![](/img/TUT13-07-Test_3.png)

</div>

Fill out the form with the information requested and complete the task.

<div class="text--center">

![](/img/TUT13-07-Test_3.png)

![](/img/TUT13-07-Test_4.png)

![](/img/TUT13-07-Test_5.png)

</div>


## Summary

In this tutorial, we have covered the basics of creating a Temporal.io-based workflow in KuFlow. We have defined a new process definition, and we have built a workflow that contemplates the following rules involving automated and human tasks:

1. Users can start an interactive sequence of the "guess the number" game.
2. The CPU registers a random number and prompts the user to enter an answer.
3. The user will have as many attempts as he or she needs and will be informed about the result.

We have created a special video with the entire process:

Here you can watch all steps in this video:

<a href="https://youtu.be/nTLGa2zheF0" target="_blank" title="Play me!">
  <p align="center">
	<img width="75%" src="https://img.youtube.com/vi/nTLGa2zheF0/maxresdefault.jpg" alt="Play me!"/>
  </p>
</a>

We sincerely hope that this step-by-step guide will help you to understand better how KuFlow can help your business to have better and more solid business processes.



