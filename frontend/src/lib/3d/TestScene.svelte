<script lang="ts">
  import { T } from '@threlte/core';
  import { OrbitControls } from '@threlte/extras';
  import { Environment } from '@threlte/extras';
</script>

<Environment isBackground files="/static/3d/casino.jpg" />

<T.AxesHelper args={[100]} />

<T.PerspectiveCamera makeDefault position={[30, 30, 30]}>
  <OrbitControls />
</T.PerspectiveCamera>

<T.DirectionalLight position={[100, 100, 50]} intensity={0.5} />
<T.DirectionalLight position={[-100, 50, -100]} intensity={0.2} />
<T.AmbientLight intensity={0.5} />

<slot />
