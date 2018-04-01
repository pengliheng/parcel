const assert = require('assert');
const WorkerFarm = require('../src/workerfarm/WorkerFarm');

describe('WorkerFarm', () => {
  it('Should start up workers', async () => {
    let workerfarm = new WorkerFarm(
      {},
      {
        warmWorkers: false,
        useLocalWorker: false,
        workerPath: require.resolve('./integration/workerfarm/ping.js')
      }
    );

    await new Promise(resolve => workerfarm.once('started', resolve));

    assert.equal(await workerfarm.run(), 'pong');

    await workerfarm.end();
  });

  it('Should handle 1000 requests without any issue', async () => {
    let workerfarm = new WorkerFarm(
      {},
      {
        warmWorkers: false,
        useLocalWorker: false,
        workerPath: require.resolve('./integration/workerfarm/echo.js')
      }
    );

    await new Promise(resolve => workerfarm.once('started', resolve));

    for (let i = 0; i < 1000; i++) {
      assert.equal(await workerfarm.run(i), i);
    }

    await workerfarm.end();
  });

  it('Should initialise workers', async () => {
    let options = {
      key: 'value'
    };
    let workerfarm = new WorkerFarm(options, {
      warmWorkers: true,
      useLocalWorker: false,
      workerPath: require.resolve('./integration/workerfarm/init.js')
    });

    await new Promise(resolve => workerfarm.once('started', resolve));

    assert.equal((await workerfarm.run()).key, options.key);

    await workerfarm.end();
  });

  it('Should warm up workers', async () => {
    let workerfarm = new WorkerFarm(
      {},
      {
        warmWorkers: true,
        useLocalWorker: true,
        workerPath: require.resolve('./integration/workerfarm/echo.js')
      }
    );

    await new Promise(resolve => workerfarm.once('started', resolve));

    for (let i = 0; i < 100; i++) {
      assert.equal(await workerfarm.run(i), i);
    }

    await new Promise(resolve => workerfarm.once('warmedup', resolve));

    assert(workerfarm.activeChildren > 0, 'Should have spawned workers.');
    assert(
      workerfarm.warmWorkers >= workerfarm.activeChildren,
      'Should have warmed up workers.'
    );

    await workerfarm.end();
  });

  it('Should use the local worker', async () => {
    let workerfarm = new WorkerFarm(
      {},
      {
        warmWorkers: true,
        useLocalWorker: true,
        workerPath: require.resolve('./integration/workerfarm/echo.js')
      }
    );

    assert.equal(await workerfarm.run('hello world'), 'hello world');
    assert.equal(workerfarm.shouldUseRemoteWorkers(), false);

    await workerfarm.end();
  });

  it('Should be able to use bi-directional communication', async () => {
    let workerfarm = new WorkerFarm(
      {},
      {
        warmWorkers: false,
        useLocalWorker: false,
        workerPath: require.resolve('./integration/workerfarm/ipc.js')
      }
    );

    await new Promise(resolve => workerfarm.once('started', resolve));

    assert.equal(await workerfarm.run(1, 2), 3);

    await workerfarm.end();
  });

  it('Should be able to handle 1000 bi-directional calls', async () => {
    let workerfarm = new WorkerFarm(
      {},
      {
        warmWorkers: false,
        useLocalWorker: false,
        workerPath: require.resolve('./integration/workerfarm/ipc.js')
      }
    );

    await new Promise(resolve => workerfarm.once('started', resolve));

    for (let i = 0; i < 1000; i++) {
      assert.equal(await workerfarm.run(1 + i, 2), 3 + i);
    }

    await workerfarm.end();
  });

  it('Bi-directional call should return masters pid', async () => {
    let workerfarm = new WorkerFarm(
      {},
      {
        warmWorkers: false,
        useLocalWorker: false,
        workerPath: require.resolve('./integration/workerfarm/ipc-pid.js')
      }
    );

    await new Promise(resolve => workerfarm.once('started', resolve));

    let result = await workerfarm.run();
    assert.equal(result.length, 2);
    assert.equal(result[1], process.pid);
    assert.notEqual(result[0], process.pid);

    await workerfarm.end();
  });
});
