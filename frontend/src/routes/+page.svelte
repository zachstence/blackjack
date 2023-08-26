<script lang="ts">
	import { io, Socket } from 'socket.io-client';
	import { onMount } from 'svelte';

	const WSS_URL = 'http://localhost:3000';

	let socket: Socket;

	onMount(() => {
		socket = io(WSS_URL);
	});

	$: {
		socket?.on('connect', () => {
			console.log('connect');
		});
	}
</script>
