/**
 * The MIT License
 * Copyright © 2021-present KuFlow S.L.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
import { getElementValueAsNumber,  Task } from '@kuflow/kuflow-rest'
import type { createKuFlowAsyncActivities, createKuFlowSyncActivities } from '@kuflow/kuflow-temporal-activity-kuflow'
import { WorkflowRequest, WorkflowResponse } from '@kuflow/kuflow-temporal-activity-kuflow'
import { LoggerSinks, proxyActivities, proxySinks, uuid4 } from '@temporalio/workflow'

const kuFlowSyncActivities = proxyActivities<ReturnType<typeof createKuFlowSyncActivities>>({
  startToCloseTimeout: '10 minutes',
  scheduleToCloseTimeout: '356 days',
})

const kuFlowAsyncActivities = proxyActivities<ReturnType<typeof createKuFlowAsyncActivities>>({
  startToCloseTimeout: '1 day',
  scheduleToCloseTimeout: '356 days',
})

const { defaultWorkerLogger: logger } = proxySinks<LoggerSinks>()

/** A workflow that simply calls an activity */
export async function GNGWorker(this: any, workflowRequest: WorkflowRequest): Promise<WorkflowResponse> {
  logger.info('Process Started', {})

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

  await kuFlowSyncActivities.KuFlow_Engine_completeProcess({ processId: workflowRequest.processId })

  logger.info('Process Finished', {})

  return { message: 'Completed' }
}

/**
 * Create task "CPU Message" in KuFlow and wait for its completion
 *
 * @param workflowRequest workflow request
 * @return task created
 */

async function createTaskCPUMessage(workflowRequest: WorkflowRequest, messageCPU: String): Promise<Task> {
  const taskId = uuid4()

  await kuFlowAsyncActivities.KuFlow_Engine_createTaskAndWaitFinished({
    task: {
      objectType: 'TASK',
      id: taskId,
      processId: workflowRequest.processId,
      taskDefinition: {
        code: 'CPUMESSAGE',
      },
      elementValues: {
        MESSAGE: [{ type: 'STRING', value: `${messageCPU}` }],
      },
    },
  })

  const { task } = await kuFlowSyncActivities.KuFlow_Engine_retrieveTask({ taskId })

  return task
}

/**
 * Create task "User Answer" in KuFlow and wait for its completion
 *
 * @param workflowRequest workflow request
 * @return task created
 */

async function createTaskUserAnswer(workflowRequest: WorkflowRequest , messageUSR: String): Promise<Task> {
  const taskId = uuid4()

  await kuFlowAsyncActivities.KuFlow_Engine_createTaskAndWaitFinished({
    task: {
      objectType: 'TASK',
      id: taskId,
      processId: workflowRequest.processId,
      taskDefinition: {
        code: 'USERANSWER',
      },
      elementValues: {
        MESSAGE: [{ type: 'STRING', value: `${messageUSR}` }],
      },
    },
  })

  const { task } = await kuFlowSyncActivities.KuFlow_Engine_retrieveTask({ taskId })

  return task
}

function createTheNumber(): number {
  // Generate a random number between 1 and 10
  const randomNumber = Math.floor(Math.random() * 10) + 1;
  return randomNumber
}
