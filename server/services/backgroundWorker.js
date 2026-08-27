"use strict";

/**
 * ─── Distributed Worker & Background Task Queue (BullMQ / In-Process Fallback) ──
 * Manages offloading heavy computational workloads:
 * - Sharp computer vision tensor preprocessing
 * - SLA breach checking & contractor penalty assessment
 * - Automated PDF notices generation
 * Gracefully operates in-process when REDIS_URL is not configured (e.g. local dev).
 */

const { EventEmitter } = require("events");

class BackgroundWorkerService extends EventEmitter {
  constructor() {
    super();
    this.isRedisActive = false;
    this.queueName = "complaint-triage-queue";
    this.localQueue = [];
    this.init();
  }

  async init() {
    if (process.env.REDIS_URL || process.env.REDIS_HOST) {
      try {
        const { Queue, Worker } = require("bullmq");
        const connection = {
          url: process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "127.0.0.1"}:6379`,
          maxRetriesPerRequest: null,
          retryStrategy: (times) => {
            if (times > 3) {
              this.isRedisActive = false;
              return null; // Stop retrying and trigger fallback
            }
            return Math.min(times * 1000, 3000);
          },
        };

        this.queue = new Queue(this.queueName, { connection });
        this.queue.on("error", (err) => {
          console.warn(`⚠️ BullMQ Queue connection warning: ${err.message}. Seamlessly switching to in-memory fallback.`);
          this.isRedisActive = false;
        });

        this.worker = new Worker(
          this.queueName,
          async (job) => {
            return this.processJob(job.name, job.data);
          },
          { connection, concurrency: 5 }
        );

        this.worker.on("failed", (job, err) => {
          console.error(
            JSON.stringify({
              level: "ERROR",
              type: "DEAD_LETTER_JOB_FAILURE",
              jobId: job?.id,
              jobName: job?.name,
              attemptsMade: job?.attemptsMade,
              error: err.message,
              timestamp: new Date().toISOString(),
            })
          );
          this.emit("job:failed", {
            jobId: job?.id,
            jobName: job?.name,
            error: err.message,
            attemptsMade: job?.attemptsMade,
            timestamp: new Date().toISOString(),
          });
        });

        this.isRedisActive = true;
        console.log(`🚀 Distributed BullMQ Worker connected to Redis for '${this.queueName}'`);
      } catch (err) {
        console.warn(`ℹ️ Redis/BullMQ unavailable (${err.message}). Falling back to in-process async worker queue.`);
        this.isRedisActive = false;
      }
    } else {
      console.log(`ℹ️ In-Process Asynchronous Background Worker Queue initialized.`);
    }

    // In-memory idempotency cache for deduplicating retries within a 5-minute window
    this.processedJobs = new Map();
  }

  /**
   * Checks if a job has already been processed to guarantee idempotency
   */
  isJobDuplicate(dedupKey) {
    if (!dedupKey) return false;
    const existing = this.processedJobs.get(dedupKey);
    if (existing && Date.now() - existing < 300000) {
      return true;
    }
    this.processedJobs.set(dedupKey, Date.now());
    return false;
  }

  /**
   * Enqueues a job for distributed or asynchronous execution
   * Automatically falls back to in-memory processing if Redis fails
   */
  async enqueueJob(jobName, data = {}, dedupKey = null) {
    const jobPayload = {
      id: dedupKey || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: jobName,
      data,
      enqueuedAt: new Date().toISOString(),
    };

    if (dedupKey && this.isJobDuplicate(dedupKey)) {
      console.log(`ℹ️ Duplicate job '${jobName}' (${dedupKey}) suppressed via Idempotency Guard.`);
      return { jobId: jobPayload.id, mode: "IDEMPOTENT_SUPPRESSED", status: "SKIPPED" };
    }

    if (this.isRedisActive && this.queue) {
      try {
        const bullJob = await this.queue.add(jobName, data, {
          jobId: dedupKey || undefined,
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: true,
        });
        return { jobId: bullJob.id, mode: "DISTRIBUTED_REDIS", status: "QUEUED" };
      } catch (err) {
        console.warn(`⚠️ Redis queue write failed (${err.message}). Seamlessly executing via in-process async fallback.`);
        this.isRedisActive = false;
      }
    }

    // In-Process Asynchronous Queue with setImmediate & Dead-Letter Accounting
    setImmediate(async () => {
      try {
        await this.processJob(jobName, data);
      } catch (err) {
        console.error(
          JSON.stringify({
            level: "ERROR",
            type: "IN_PROCESS_JOB_FAILURE",
            jobName,
            error: err.message,
            timestamp: new Date().toISOString(),
          })
        );
        this.emit("job:failed", {
          jobName,
          error: err.message,
          timestamp: new Date().toISOString(),
        });
      }
    });

    return { jobId: jobPayload.id, mode: "IN_PROCESS_ASYNC", status: "PROCESSING" };
  }

  /**
   * Worker processor executing heavy tasks
   */
  async processJob(jobName, data) {
    switch (jobName) {
      case "TENSOR_IMAGE_PREPROCESS": {
        const localVisionService = require("./localVisionService");
        if (data.imageBuffer) {
          const buf = Buffer.isBuffer(data.imageBuffer) ? data.imageBuffer : Buffer.from(data.imageBuffer, "base64");
          return await localVisionService.classifyImageBuffer(buf, data.textHint || "");
        }
        return null;
      }

      case "CHECK_SLA_BREACHES": {
        const slaService = require("./slaService");
        return await slaService.checkSlaBreaches();
      }

      case "PDF_NOTICE_GENERATION": {
        const noticePdfService = require("./noticePdfService");
        return await noticePdfService.generateNotice(data);
      }

      default:
        console.log(`ℹ️ Processed generic task '${jobName}'`);
        return { success: true, processedAt: new Date().toISOString() };
    }
  }
}

module.exports = new BackgroundWorkerService();
