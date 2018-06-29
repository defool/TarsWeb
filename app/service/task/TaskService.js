/**
 * Tencent is pleased to support the open source community by making Tars available.
 *
 * Copyright (C) 2016THL A29 Limited, a Tencent company. All rights reserved.
 *
 * Licensed under the BSD 3-Clause License (the "License"); you may not use this file except 
 * in compliance with the License. You may obtain a copy of the License at
 *
 * https://opensource.org/licenses/BSD-3-Clause
 *
 * Unless required by applicable law or agreed to in writing, software distributed 
 * under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR 
 * CONDITIONS OF ANY KIND, either express or implied. See the License for the 
 * specific language governing permissions and limitations under the License.
 */
 
const logger = require('../../logger');
const AdminService = require('../../service/admin/AdminService');
const ServerService = require('../../service/server/ServerService');
const util = require('../../tools/util');
const TaskDao = require('../../dao/TaskDao');


const TaskService = {};




TaskService.getTaskRsp = async (taskNo) => {
    let rsp = await AdminService.getTaskRsp(taskNo).catch(e => logger.error('[adminService.getTaskRsp]:',e));
    logger.info('getTaskRsp:',rsp);
    return {
        task_no : rsp.taskNo,
        serial : rsp.serial,
        status : rsp.status,
        items : rsp.taskItemRsp.map(item => {
            return {
                task_no : item.req.taskNo,
                item_no : item.req.itemNo,
                application : item.req.application,
                server_name : item.req.serverName,
                node_name : item.req.nodeName,
                command : item.req.command,
                parameters : item.parameters,
                start_time : item.startTime,
                end_time : item.endTime,
                status : item.status,
                status_info : item.statusInfo,
                execute_info : item.executeLog
            }
        })
    };
};


TaskService.getTasks = async (params) => {
    return await TaskDao.getTask(params);
};

TaskService.addTask = async (params) => {
    let items = [];
    for(let i=0,len=params.items.length;i<len;i++) {
        let item = params.items[i];
        let parameters = item.parameters;
        if(Object.prototype.toString.call(parameters)=='[object Object]' && parameters.bak_flag!=undefined){
            parameters.bak_flag = (1 & parameters.bak_flag).toString();
        }
        let obj = {
            taskNo : params.task_no,
            itemNo : util.getUUID(),
            command : item.command,
            parameters : parameters
        };
        let serverConf = await ServerService.getServerConfById(item.server_id.toString()).catch(e => {
            console.error('[ServerService.getServerConfById]:',e.toString());
            return Promise.reject(e.toString());
        });

        Object.assign(obj,{
            application : serverConf.application,
            serverName : serverConf.server_name,
            nodeName : serverConf.node_name
        });
        items.push(obj);
        logger.info('[TaskService.addTask items]:',obj);
    }
    let req = {
        taskNo : params.task_no,
        taskItemReq : items,
        serial : params.serial,
        userName : params.user_name || ''
    };
    await AdminService.addTask(req).catch(e => {console.error('[AdminService.addTask]:',e)});
    return params.task_no;
};

module.exports = TaskService;